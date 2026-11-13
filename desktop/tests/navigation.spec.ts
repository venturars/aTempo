import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'
import path from 'node:path'
import { dashboardPathForProfile } from '../src/renderer/src/session/sessionStore'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out', 'main', 'index.js')

const unknownHashes = ['#/register', '#/signup', '#/login', '#/sign-in', '#/sign up']
const loginErrorPhrases = ['El correo es obligatorio.', 'La contraseña es obligatoria.']

async function openApp(flags: string[]): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', ...flags, mainFile],
    cwd: appRoot
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 960, height: 720 })
  await window.evaluate(() => document.fonts.ready)
  return { app, window }
}

async function withApp(flags: string[], run: (window: Page) => Promise<void>): Promise<void> {
  const { app, window } = await openApp(flags)
  try {
    await run(window)
  } finally {
    await app.close()
  }
}

async function readRoute(window: Page): Promise<string> {
  const hash = await window.evaluate(() => window.location.hash)
  return hash.replace(/^#\/?/, '')
}

async function changeHash(window: Page, nextHash: string): Promise<void> {
  await window.evaluate((hash) => {
    window.location.hash = hash
  }, nextHash)
}

async function expectLoginScreen(window: Page): Promise<void> {
  await expect(
    window.getByRole('heading', { name: 'Pasar lista ya no es parte de la clase.', level: 1 })
  ).toBeVisible()
  await expect(window.getByText('Entra con tu correo.')).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await expect(window.getByRole('button', { name: 'Crear mi cuenta' })).toHaveCount(0)
  await expect(window.getByText('En construcción')).toHaveCount(0)
}

async function expectNoLoginScreen(window: Page): Promise<void> {
  await expect(window.getByText('Entra con tu correo.')).toHaveCount(0)
  await expect(window.getByRole('button', { name: 'Entrar' })).toHaveCount(0)
}

async function expectRegisterScreen(window: Page): Promise<void> {
  await expect(window.getByRole('button', { name: 'Crear mi cuenta' })).toBeVisible()
  await expectNoLoginScreen(window)
}

async function expectStudentDashboard(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { name: 'Dashboard alumno', level: 1 })).toBeVisible()
  await expectNoLoginScreen(window)
}

async function expectOrganizationDashboard(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { name: 'Resumen', level: 1 })).toBeVisible()
  await expect(window.getByText('En construcción')).toHaveCount(0)
  await expectNoLoginScreen(window)
}

async function expectUnderConstruction(window: Page, title: string): Promise<void> {
  await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(window.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  await expect(window.getByText('En construcción')).toBeVisible()
  await expectNoLoginScreen(window)
}

test('shows the login when the app opens without flags', async () => {
  await withApp([], async (window) => {
    expect(await readRoute(window)).toBe('')
    await expectLoginScreen(window)
    await expect(window.getByRole('status')).toHaveCount(0)
  })
})

test('shows the organization summary with --organization-dashboard', async () => {
  await withApp(['--organization-dashboard'], async (window) => {
    expect(await readRoute(window)).toBe('organization/dashboard')
    await expectOrganizationDashboard(window)
    await expect(window).toHaveScreenshot('navigation-organization-dashboard.png', {
      animations: 'disabled'
    })
  })
})

test('shows the teacher panel under construction with --panel', async () => {
  await withApp(['--panel'], async (window) => {
    expect(await readRoute(window)).toBe('teacher/panel')
    await expectUnderConstruction(window, 'Panel del profesor')
    await expect(window).toHaveScreenshot('navigation-teacher-panel.png', {
      animations: 'disabled'
    })
  })
})

test('shows the login when the hash changes to an unknown route from any screen', async () => {
  const startFlags = [['--dashboard'], ['--organization-dashboard'], ['--panel']]

  for (const flags of startFlags) {
    await withApp(flags, async (window) => {
      await expectNoLoginScreen(window)

      for (const hash of unknownHashes) {
        await changeHash(window, hash)
        await expectLoginScreen(window)
      }
    })
  }
})

test('keeps the login and shows the alert after a valid login without profile', async () => {
  await withApp([], async (window) => {
    const routeBefore = await readRoute(window)
    await window.getByLabel('Correo').fill('ana@clase.test')
    await window.getByLabel('Contraseña').fill('secreta12')
    await window.getByRole('button', { name: 'Entrar' }).click()

    const alert = window.getByRole('status')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('Correo: ana@clase.test')
    await expect(alert).toContainText('Contraseña: secreta12')
    expect(await readRoute(window)).toBe(routeBefore)
    await expectLoginScreen(window)
  })
})

test('gives the dashboard path of each profile', () => {
  expect(dashboardPathForProfile('student')).toBe('/student/dashboard')
  expect(dashboardPathForProfile('teacher')).toBe('/teacher/panel')
  expect(dashboardPathForProfile('organization')).toBe('/organization/dashboard')
})

test('opens the first flag in priority order when several flags are passed', async () => {
  await withApp(['--sign-up', '--dashboard'], async (window) => {
    expect(await readRoute(window)).toBe('student/dashboard')
    await expectStudentDashboard(window)
  })

  await withApp(['--panel', '--sign-up'], async (window) => {
    expect(await readRoute(window)).toBe('sign-up')
    await expectRegisterScreen(window)
  })

  await withApp(['--panel', '--organization-dashboard'], async (window) => {
    expect(await readRoute(window)).toBe('organization/dashboard')
    await expectOrganizationDashboard(window)
  })
})

test('shows the login for a hash with spaces or capital letters', async () => {
  await withApp(['--dashboard'], async (window) => {
    for (const hash of ['#/sign up', '#/Sign-Up']) {
      await changeHash(window, hash)
      await expectLoginScreen(window)
    }
  })
})

test('changes the screen without reloading when the hash changes', async () => {
  await withApp([], async (window) => {
    await window.evaluate(() => {
      document.body.dataset.navigationMarker = 'same-page'
    })

    await changeHash(window, '#/sign-up')
    await expectRegisterScreen(window)

    await changeHash(window, '#/student/dashboard')
    await expectStudentDashboard(window)

    await changeHash(window, '#/teacher/panel')
    await expectUnderConstruction(window, 'Panel del profesor')

    await changeHash(window, '#/')
    await expectLoginScreen(window)

    const marker = await window.evaluate(() => document.body.dataset.navigationMarker)
    expect(marker).toBe('same-page')
  })
})

test('shows the errors and does not navigate after an invalid login', async () => {
  await withApp([], async (window) => {
    const routeBefore = await readRoute(window)
    await window.getByRole('button', { name: 'Entrar' }).click()

    for (const phrase of loginErrorPhrases) {
      await expect(window.getByText(phrase)).toBeVisible()
    }
    await expect(window.getByRole('status')).toHaveCount(0)
    expect(await readRoute(window)).toBe(routeBefore)
    await expectLoginScreen(window)
  })
})
