import { expect, test, type Locator } from '@playwright/test'

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

test.beforeEach(async ({ context }) => {
  await context.route(/\/api\/auth\/(login|me|refresh|logout)$/, async (route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname.endsWith('/login')) {
      await route.fulfill({ status: 401, json: { code: 'INVALID_CREDENTIALS' } })
      return
    }
    await route.fulfill({ status: 401, json: {} })
  })
})

test('the student login shows and hides the password', async ({ page }) => {
  await page.goto('/')
  await expectToggles(page.getByLabel('Contraseña', { exact: true }))
})

test('the admin login hides the password again on submit', async ({ page }) => {
  await page.goto('/admin')
  const password = page.getByLabel('Contraseña', { exact: true })
  await expectToggles(password)
  await page.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
  await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('no son correctos')
  await expect(password).toHaveAttribute('type', 'password')
})
