import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'
import { dashboardPathForProfile } from '../src/renderer/src/session/sessionStore'

const unknownHashes = ['#/register', '#/signup', '#/login', '#/sign-in', '#/sign up']
const loginErrorPhrases = ['El correo es obligatorio.', 'La contraseña es obligatoria.']

async function openApp(flags: string[]): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await launchHiddenElectron([...flags])
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
  const hash = await window.evaluate(() => globalThis.location.hash)
  return hash.replace(/^#\/?/, '')
}

async function changeHash(window: Page, nextHash: string): Promise<void> {
  await window.evaluate((hash) => {
    globalThis.location.hash = hash
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

async function expectTeacherPanel(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(window.getByRole('heading', { name: 'Hoy', level: 1 })).toBeVisible()
  await expect(window.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
  await expect(window.getByText('En construcción')).toHaveCount(0)
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

test('shows the teacher panel through the router after a normal startup', async () => {
  await withApp([], async (window) => {
    await expectLoginScreen(window)
    expect(await readRoute(window)).toBe('')
    await changeHash(window, '#/teacher/panel')
    expect(await readRoute(window)).toBe('teacher/panel')
    await expectTeacherPanel(window)
    await expect(window).toHaveScreenshot('navigation-teacher-panel.png', {
      animations: 'disabled'
    })
  })
})

test('shows the login when the hash changes to an unknown route from any screen', async () => {
  const startFlags = [['--dashboard'], ['--organization-dashboard'], []]

  for (const flags of startFlags) {
    await withApp(flags, async (window) => {
      if (flags.length === 0) {
        await expectLoginScreen(window)
        await changeHash(window, '#/teacher/panel')
        await expectTeacherPanel(window)
      }
      await expectNoLoginScreen(window)

      for (const hash of unknownHashes) {
        await changeHash(window, hash)
        await expectLoginScreen(window)
      }
    })
  }
})

test('keeps the login and shows an error for an unknown email without credential echo', async () => {
  await withApp([], async (window) => {
    const routeBefore = await readRoute(window)
    await window.getByLabel('Correo').fill('ana@clase.test')
    await window.getByLabel('Contraseña').fill('secreta12')
    await window.getByRole('button', { name: 'Entrar' }).click()

    const alert = window.getByRole('alert')
    await expect(alert).toHaveText('El correo o la contraseña no coinciden.')
    await expect(window.getByRole('status')).toHaveCount(0)
    const text = await window.locator('body').innerText()
    expect(text).not.toContain('ana@clase.test')
    expect(text).not.toContain('secreta12')
    expect(await readRoute(window)).toBe(routeBefore)
    await expectLoginScreen(window)
    await expect(window).toHaveScreenshot('login-alert.png', { animations: 'disabled' })
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

  await withApp(['--organization-dashboard', '--sign-up'], async (window) => {
    expect(await readRoute(window)).toBe('sign-up')
    await expectRegisterScreen(window)
  })

  await withApp(['--organization-dashboard', '--sign-up', '--dashboard'], async (window) => {
    expect(await readRoute(window)).toBe('student/dashboard')
    await expectStudentDashboard(window)
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
    await expectTeacherPanel(window)

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
