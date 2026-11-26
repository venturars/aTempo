import { expect, test, type Locator } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'

// Contraseñas de prueba de la demo. No son credenciales reales.
const typedText = 'texto-visible'

// El botón de ojo vive en el mismo contenedor que su campo.
async function expectToggles(field: Locator): Promise<void> {
  const box = field.locator('..')
  await field.fill(typedText)
  await expect(field).toHaveAttribute('type', 'password')
  await box.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click()
  await expect(field).toHaveAttribute('type', 'text')
  await expect(field).toHaveValue(typedText)
  await box.getByRole('button', { name: 'Ocultar contraseña', exact: true }).click()
  await expect(field).toHaveAttribute('type', 'password')
}

test('the login shows and hides the password and hides it again on submit', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await expectToggles(window.getByLabel('Contraseña', { exact: true }))
    await window.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
    await window.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click()
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window.getByRole('alert')).toBeVisible()
    await expect(window.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
      'type',
      'password'
    )
  } finally {
    await app.close()
  }
})

test('the invitation shows and hides the new password', async () => {
  const app = await launchHiddenElectron(['--invitation=731905'])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('heading', { level: 1, name: 'Hola, Lucía' })).toBeVisible()
    await expectToggles(window.getByLabel('Contraseña', { exact: true }))
  } finally {
    await app.close()
  }
})

test('every field of «Cambiar contraseña» has its own eye button', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await window.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
    await window.getByLabel('Contraseña', { exact: true }).fill('Profesor123!')
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await window.locator('aside details.dropdown > summary').click()
    await window.getByRole('button', { name: 'Cambiar contraseña' }).click()
    const dialog = window.getByRole('dialog', { name: 'Cambiar contraseña' })
    await expect(dialog.getByRole('button', { name: 'Mostrar contraseña' })).toHaveCount(3)
    for (const label of ['Contraseña actual', 'Nueva contraseña', 'Repite la nueva contraseña']) {
      await expectToggles(dialog.getByLabel(label, { exact: true }))
    }
  } finally {
    await app.close()
  }
})

test('matches «Cambiar contraseña» with the new password visible', async () => {
  test.skip(process.platform !== 'darwin', 'Las capturas de referencia son de macOS.')
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await window.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
    await window.getByLabel('Contraseña', { exact: true }).fill('Profesor123!')
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await window.locator('aside details.dropdown > summary').click()
    await window.getByRole('button', { name: 'Cambiar contraseña' }).click()
    const dialog = window.getByRole('dialog', { name: 'Cambiar contraseña' })
    await dialog.getByLabel('Contraseña actual', { exact: true }).fill(typedText)
    const next = dialog.getByLabel('Nueva contraseña', { exact: true })
    await next.fill(typedText)
    await next.locator('..').getByRole('button', { name: 'Mostrar contraseña' }).click()
    await expect(next).toHaveAttribute('type', 'text')
    await window.mouse.move(0, 0)
    await expect(dialog.locator('.modal-box')).toHaveScreenshot('change-password.png', {
      animations: 'disabled'
    })
  } finally {
    await app.close()
  }
})
