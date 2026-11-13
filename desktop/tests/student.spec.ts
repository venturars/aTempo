import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'
import path from 'node:path'
import { statusForArrival } from '../src/renderer/src/student/attendanceStatus'
import { normalizeEmail } from '../src/renderer/src/student/studentAccounts'
import { exampleStudent } from '../src/renderer/src/student/studentExample'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out', 'main', 'index.js')

async function withApp(flags: string[], run: (window: Page) => Promise<void>): Promise<void> {
  const app: ElectronApplication = await electron.launch({
    args: ['--force-device-scale-factor=1', ...flags, mainFile],
    cwd: appRoot
  })
  try {
    const window = await app.firstWindow()
    await window.setViewportSize({ width: 960, height: 720 })
    await window.evaluate(() => document.fonts.ready)
    await run(window)
  } finally {
    await app.close()
  }
}

async function readHash(window: Page): Promise<string> {
  return window.evaluate(() => window.location.hash)
}

async function expectStudentDashboard(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { name: 'Dashboard alumno', level: 1 })).toBeVisible()
  expect(await readHash(window)).toBe('#/student/dashboard')
}

async function signUp(window: Page, name: string, email: string, password: string): Promise<void> {
  await window.getByLabel('Nombre completo').fill(name)
  await window.getByLabel('Correo electrónico').fill(email)
  await window.getByLabel('Contraseña', { exact: true }).fill(password)
  await window.getByLabel('Repetir contraseña').fill(password)
  await window.getByRole('button', { name: 'Crear mi cuenta' }).click()
}

async function logIn(window: Page, email: string, password: string): Promise<void> {
  await window.getByLabel('Correo').fill(email)
  await window.getByLabel('Contraseña').fill(password)
  await window.getByRole('button', { name: 'Entrar' }).click()
}

test('opens the student dashboard after a valid sign-up', async () => {
  await withApp(['--sign-up'], async (window) => {
    await signUp(window, 'Lucía Pérez', 'lucia@clase.test', 'secreta12')
    await expectStudentDashboard(window)
    await expect(window.getByText('Bienvenido Lucía Pérez')).toBeVisible()
    await expect(window.getByRole('status')).toHaveCount(0)
  })
})

test('opens the student dashboard after logging in with the sample account', async () => {
  await withApp([], async (window) => {
    await logIn(window, exampleStudent.email, exampleStudent.password)
    await expectStudentDashboard(window)
    await expect(window.getByText('Bienvenido Ada López')).toBeVisible()
  })
})

test('logs in with an account created in the sign-up', async () => {
  await withApp(['--sign-up'], async (window) => {
    await signUp(window, 'Ana', 'Ana@Clase.test', 'secreta12')
    await expectStudentDashboard(window)

    await window.evaluate(() => {
      window.location.hash = '#/'
    })
    await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await logIn(window, ' ana@clase.test ', 'secreta12')
    await expectStudentDashboard(window)
    await expect(window.getByText('Bienvenido Ana')).toBeVisible()
  })
})

test('shows a password error and stays in the login with a wrong password', async () => {
  await withApp([], async (window) => {
    await logIn(window, exampleStudent.email, 'otra-clave-1')
    await expect(window.getByText('La contraseña no es la de esta cuenta.')).toBeVisible()
    await expect(window.getByRole('status')).toHaveCount(0)
    expect(await readHash(window)).not.toBe('#/student/dashboard')
  })
})

test('gives presente up to 09:10 and tarde after', () => {
  expect(statusForArrival('08:58', '09:00', 10)).toBe('presente')
  expect(statusForArrival('09:10', '09:00', 10)).toBe('presente')
  expect(statusForArrival('09:11', '09:00', 10)).toBe('tarde')
  expect(statusForArrival('09:14', '09:00', 10)).toBe('tarde')
})

test('normalizes the email by trimming and lowercasing', () => {
  expect(normalizeEmail('  Ada.Lopez@Clase.TEST ')).toBe('ada.lopez@clase.test')
})

async function openScan(window: Page): Promise<void> {
  await window.getByRole('button', { name: 'Registrar asistencia' }).click()
  await expect(
    window.getByRole('heading', { name: 'Registrar asistencia', level: 1 })
  ).toBeVisible()
  expect(await readHash(window)).toBe('#/student/scan')
}

async function readWith(window: Page, reading: string): Promise<void> {
  await window.getByRole('button', { name: 'Escanear' }).click()
  await expect(window.getByRole('dialog')).toBeVisible()
  await window.getByRole('button', { name: reading }).click()
  await expect(window.getByRole('dialog')).toBeHidden()
}

test('navigates from the dashboard to the scan and history screens', async () => {
  await withApp(['--dashboard'], async (window) => {
    await expect(window.getByText('Bienvenido Ada López')).toBeVisible()
    await openScan(window)
    await expect(window.getByText('Clase de hoy: Mié 11 nov, 09:00')).toBeVisible()
    await window.getByRole('link', { name: 'Volver' }).click()
    await expectStudentDashboard(window)
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible()
    expect(await readHash(window)).toBe('#/student/history')
    await window.getByRole('link', { name: 'Volver' }).click()
    await expectStudentDashboard(window)
  })
})

test('keeps the next class and notice actions without navigation', async () => {
  await withApp(['--dashboard'], async (window) => {
    await window.locator('#proxima-clase').click()
    await window.locator('#avisar-retrasos-ausencias').click()
    await expectStudentDashboard(window)
  })
})

test('confirms Presente when scanning at 08:58', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await readWith(window, 'Llegar a las 08:58')
    await expect(window.getByRole('status')).toHaveText('Presente · 08:58')
  })
})

test('confirms Tarde when scanning at 09:14', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await readWith(window, 'Llegar a las 09:14')
    await expect(window.getByRole('status')).toHaveText('Tarde · 09:14')
  })
})

test('lists date, entry time and status in the history', async () => {
  await withApp(['--dashboard'], async (window) => {
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    const rows = window.locator('ul.list li')
    await expect(rows).toHaveCount(exampleStudent.history.length)
    await expect(rows.first()).toContainText('Mar 10 nov')
    await expect(rows.first()).toContainText('08:57')
    await expect(rows.first()).toContainText('Presente')
    await expect(rows.nth(1)).toContainText('Tarde')
    await expect(rows.nth(2)).toContainText('Vie 6 nov')
    await expect(rows.nth(2)).toContainText('—')
    await expect(rows.nth(2)).toContainText('Ausente')
  })
})

test('adds the confirmed scan to the top of the history', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await readWith(window, 'Llegar a las 08:58')
    await expect(window.getByRole('status')).toHaveText('Presente · 08:58')
    await window.getByRole('link', { name: 'Volver' }).click()
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    const first = window.locator('ul.list li').first()
    await expect(first).toContainText('Mié 11 nov')
    await expect(first).toContainText('08:58')
    await expect(first).toContainText('Presente')
  })
})

test('does not confirm a code from another class', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await readWith(window, 'Código de otra clase')
    await expect(window.getByRole('status')).toHaveText('Este código no es de esta clase.')
    await window.getByRole('link', { name: 'Volver' }).click()
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.locator('ul.list li')).toHaveCount(exampleStudent.history.length)
    await expect(window.locator('ul.list li').first()).toContainText('Mar 10 nov')
  })
})

test('does not duplicate the entry on a second valid reading', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await readWith(window, 'Llegar a las 08:58')
    await readWith(window, 'Llegar a las 09:14')
    await expect(window.getByRole('status')).toHaveText('Ya registraste tu entrada a las 08:58.')
    await window.getByRole('link', { name: 'Volver' }).click()
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.locator('ul.list li')).toHaveCount(exampleStudent.history.length + 1)
  })
})

test('closes the reader with Cerrar without changing anything', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await window.getByRole('button', { name: 'Escanear' }).click()
    await expect(window.getByRole('dialog')).toBeVisible()
    await window.getByRole('button', { name: 'Cerrar' }).click()
    await expect(window.getByRole('dialog')).toBeHidden()
    await expect(window.getByRole('status')).toHaveCount(0)
  })
})

test('closes the reader by clicking the backdrop without changing anything', async () => {
  await withApp(['--dashboard'], async (window) => {
    await openScan(window)
    await window.getByRole('button', { name: 'Escanear' }).click()
    await expect(window.getByRole('dialog')).toBeVisible()
    await window.mouse.click(5, 5)
    await expect(window.getByRole('dialog')).toBeHidden()
    await expect(window.getByRole('status')).toHaveCount(0)
  })
})

test('uses the sample account in scan and history without a session', async () => {
  await withApp([], async (window) => {
    await window.evaluate(() => {
      window.location.hash = '#/student/scan'
    })
    await expect(
      window.getByRole('heading', { name: 'Registrar asistencia', level: 1 })
    ).toBeVisible()
    await readWith(window, 'Llegar a las 08:58')
    await expect(window.getByRole('status')).toHaveText('Presente · 08:58')
    await window.evaluate(() => {
      window.location.hash = '#/student/history'
    })
    await expect(window.locator('ul.list li')).toHaveCount(exampleStudent.history.length + 1)
  })
})

test('scans with an account created in the sign-up and records into its own history', async () => {
  await withApp(['--sign-up'], async (window) => {
    await signUp(window, 'Lucía Pérez', 'lucia@clase.test', 'secreta12')
    await expect(window.getByText('Bienvenido Lucía Pérez')).toBeVisible()
    await openScan(window)
    await readWith(window, 'Llegar a las 09:14')
    await expect(window.getByRole('status')).toHaveText('Tarde · 09:14')
    await window.getByRole('link', { name: 'Volver' }).click()
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.locator('ul.list li')).toHaveCount(1)
    await expect(window.locator('ul.list li').first()).toContainText('Tarde')
  })
})

test('shows the empty history of a new account', async () => {
  await withApp(['--sign-up'], async (window) => {
    await signUp(window, 'Lucía Pérez', 'lucia@clase.test', 'secreta12')
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.getByText('Todavía no tienes clases.')).toBeVisible()
  })
})

async function expectNoHorizontalScroll(window: Page): Promise<void> {
  const widths = await window.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }))
  expect(widths.content).toBeLessThanOrEqual(widths.viewport)
}

test('fits every student screen in 390 pixels without horizontal scroll', async () => {
  await withApp(['--sign-up'], async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalScroll(window)
    await expect(window).toHaveScreenshot('student-register-390.png', { animations: 'disabled' })
    await signUp(window, 'Lucía Pérez', 'lucia@clase.test', 'secreta12')
    await expectStudentDashboard(window)
    await expectNoHorizontalScroll(window)
    await expect(window).toHaveScreenshot('student-dashboard-390.png', { animations: 'disabled' })
    await openScan(window)
    await expectNoHorizontalScroll(window)
    await expect(window).toHaveScreenshot('student-scan-390.png', { animations: 'disabled' })
    await window.getByRole('button', { name: 'Escanear' }).click()
    await expect(window.getByRole('dialog')).toBeVisible()
    await expectNoHorizontalScroll(window)
    await window.getByRole('button', { name: 'Cerrar' }).click()
    await window.getByRole('link', { name: 'Volver' }).click()
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.getByRole('heading', { name: 'Historial', level: 1 })).toBeVisible()
    await expectNoHorizontalScroll(window)
    await expect(window).toHaveScreenshot('student-history-empty-390.png', {
      animations: 'disabled'
    })
  })
  await withApp(['--dashboard'], async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })
    await window.getByRole('button', { name: 'Resumen de asistencia' }).click()
    await expect(window.locator('ul.list li')).toHaveCount(exampleStudent.history.length)
    await expectNoHorizontalScroll(window)
    await expect(window).toHaveScreenshot('student-history-390.png', { animations: 'disabled' })
  })
  await withApp(['--dashboard'], async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })
    await openScan(window)
    await readWith(window, 'Llegar a las 08:58')
    await expect(window.getByRole('status')).toHaveText('Presente · 08:58')
    await expectNoHorizontalScroll(window)
    await expect(window).toHaveScreenshot('student-scan-confirmed-390.png', {
      animations: 'disabled'
    })
  })
  await withApp([], async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalScroll(window)
  })
})
