import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test'
import path from 'node:path'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out', 'main', 'index.js')

async function openApp(): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', mainFile],
    cwd: appRoot
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 960, height: 720 })
  await window.evaluate(() => document.fonts.ready)
  return { app, window }
}

test('shows the login screen', async () => {
  const { app, window } = await openApp()

  await expect(window.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  await expect(window.getByText('Usa la cuenta que te ha dado tu centro.')).toBeVisible()
  await expect(window.getByLabel('Correo electrónico')).toBeVisible()
  await expect(window.getByLabel('Contraseña')).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await expect(window.getByRole('status')).toHaveCount(0)
  await expect(window).toHaveScreenshot('login-empty.png', { animations: 'disabled' })

  await app.close()
})

test('shows both errors when the fields are empty', async () => {
  const { app, window } = await openApp()

  await window.getByRole('button', { name: 'Entrar' }).click()

  await expect(window.getByText('El correo es obligatorio.')).toBeVisible()
  await expect(window.getByText('La contraseña es obligatoria.')).toBeVisible()
  await expect(window.getByRole('status')).toHaveCount(0)
  await expect(window).toHaveScreenshot('login-errors.png', { animations: 'disabled' })

  await app.close()
})

test('shows an error when the email has no email shape', async () => {
  const { app, window } = await openApp()

  await window.getByLabel('Correo electrónico').fill('ana')
  await window.getByLabel('Contraseña').fill('secreta')
  await window.getByRole('button', { name: 'Entrar' }).click()

  await expect(window.getByText('El correo no tiene una forma válida.')).toBeVisible()
  await expect(window.getByRole('status')).toHaveCount(0)

  await app.close()
})

test('shows the written email and password in an alert', async () => {
  const { app, window } = await openApp()

  await window.getByLabel('Correo electrónico').fill('ana@clase.test')
  await window.getByLabel('Contraseña').fill('secreta')
  await window.getByRole('button', { name: 'Entrar' }).click()

  const alert = window.getByRole('status')
  await expect(alert).toContainText('Correo: ana@clase.test')
  await expect(alert).toContainText('Contraseña: secreta')
  await expect(window).toHaveScreenshot('login-alert.png', { animations: 'disabled' })

  await app.close()
})
