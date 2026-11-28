import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { adminDemoAccount } from '../src/renderer/src/login/adminDemoAccount'
import { teacherDemoAccount } from '../src/renderer/src/login/teacherDemoAccount'
import { launchHiddenElectron } from './helpers/electron'

async function logIn(window: Page, email: string, secret: string): Promise<void> {
  await window.getByLabel('Correo', { exact: true }).fill(email)
  await window.getByLabel('Contraseña', { exact: true }).fill(secret)
  await window.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function openAdmin(): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await launchHiddenElectron()
  const window = await app.firstWindow()
  await logIn(window, adminDemoAccount.email, adminDemoAccount.password)
  await expect(window).toHaveURL(/#\/admin$/)
  return { app, window }
}

async function adminNav(window: Page, name: string): Promise<void> {
  await window
    .getByRole('navigation', { name: 'Administración', exact: true })
    .getByRole('link', { name, exact: true })
    .click()
}

test('the admin account opens the same administration as the web', async () => {
  const { app, window } = await openAdmin()
  try {
    const nav = window.getByRole('navigation', { name: 'Administración', exact: true })
    for (const name of ['Inicio', 'Personas', 'Cursos', 'Mis clases']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible()
    }
    await expect(window.getByText('Neoland', { exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})

test('invites a person from Electron', async () => {
  const { app, window } = await openAdmin()
  try {
    await adminNav(window, 'Personas')
    await window.getByRole('button', { name: 'Invitar persona', exact: true }).click()
    await window.getByLabel('Nombre', { exact: true }).fill('Carla')
    await window.getByLabel('Apellidos', { exact: true }).fill('Pérez')
    await window.getByLabel('Documento de identidad', { exact: true }).fill('Y0000001')
    await window.getByLabel('Correo', { exact: true }).fill('carla@clase.test')
    await window.getByLabel('Rol', { exact: true }).selectOption('student')
    await window.getByRole('button', { name: 'Preparar invitación', exact: true }).click()
    await expect(window.getByRole('status')).toContainText('Invitación preparada para Carla Pérez')
    await expect(window.getByRole('row').filter({ hasText: 'carla@clase.test' })).toContainText(
      'Invitación pendiente'
    )
  } finally {
    await app.close()
  }
})

test('creates a course and schedules a session from Electron', async () => {
  const { app, window } = await openAdmin()
  try {
    await adminNav(window, 'Cursos')
    await window.getByRole('button', { name: 'Crear curso', exact: true }).click()
    await window.getByLabel('Nombre del curso', { exact: true }).fill('Curso de escritorio')
    const teacher = window
      .getByLabel('Profesor', { exact: true })
      .locator('option')
      .filter({ hasText: 'Lucía' })
    await window
      .getByLabel('Profesor', { exact: true })
      .selectOption((await teacher.getAttribute('value'))!)
    await window.getByRole('checkbox', { name: /Ana/ }).check()
    await window.getByRole('button', { name: 'Guardar curso', exact: true }).click()
    await expect(window.getByRole('heading', { level: 1 })).toHaveText('Curso de escritorio')
    await window.getByRole('button', { name: 'Programar sesión', exact: true }).click()
    await window.getByLabel('Fecha', { exact: true }).fill('2026-11-21')
    await window.getByLabel('Hora de inicio', { exact: true }).fill('09:00')
    await window.getByLabel('Hora de fin', { exact: true }).fill('11:00')
    await window.getByLabel('Aula', { exact: true }).fill('Aula 2')
    await window.getByRole('button', { name: 'Guardar sesión', exact: true }).click()
    await expect(window).toHaveURL(/#\/admin\/sessions\/session-/)
    await expect(
      window.getByRole('heading', { name: 'Listado de alumnos · 1', exact: true })
    ).toBeVisible()
  } finally {
    await app.close()
  }
})

test('logging out closes the administration', async () => {
  const { app, window } = await openAdmin()
  try {
    await window.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    await window.evaluate(() => {
      window.location.hash = '#/admin/people'
    })
    await expect(window).toHaveURL(/#\/$/)
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})

test('the teacher account still opens the teacher panel', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await logIn(window, teacherDemoAccount.email, teacherDemoAccount.password)
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
  } finally {
    await app.close()
  }
})

test('matches the administration screens at 1280 px', async () => {
  test.skip(process.platform !== 'darwin', 'Las capturas de referencia son de macOS.')
  const { app, window } = await openAdmin()
  try {
    await window.setViewportSize({ width: 1280, height: 900 })
    await window.mouse.move(0, 0)
    await expect(window).toHaveScreenshot('admin-desktop-home.png', { animations: 'disabled' })
    await adminNav(window, 'Personas')
    await expect(window.getByRole('row')).toHaveCount(5)
    await window.mouse.move(0, 0)
    await expect(window).toHaveScreenshot('admin-desktop-people.png', { animations: 'disabled' })
  } finally {
    await app.close()
  }
})
