import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context, page }) => {
  await context.route(/\/api\/auth\/web\/session$/, async (route) => {
    await route.fulfill({ status: 401, json: {} })
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('has no open signup or account activation flow', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Hola de nuevo' })).toBeVisible()
  await expect(page.getByText('Crear mi cuenta')).toHaveCount(0)
  await page.goto('/sign-up')
  await expect(page.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toHaveCount(0)

  await page.goto('/?invitation=264018')
  await expect(page.getByRole('status')).toContainText('todavía no está disponible')
  await expect(page.getByLabel('Documento de identidad')).toHaveCount(0)
  await expect(page.getByLabel('Contraseña')).toHaveCount(1)
  expect(
    await page.evaluate(() => ({
      session: localStorage.getItem('atempo-student-session'),
      accounts: localStorage.getItem('atempo-student-accounts')
    }))
  ).toEqual({ session: null, accounts: null })
})

test('unknown invitation links also report activation unavailable', async ({ page }) => {
  await page.goto('/?invitation=000000')
  await expect(page.getByRole('status')).toContainText('todavía no está disponible')
  await expect(page.getByRole('heading', { level: 1, name: 'Hola de nuevo' })).toBeVisible()
})

// Las capturas se hacen en macOS, como las de Electron: en Linux cambian las fuentes.
test('matches unavailable invitation screen at 390 px', async ({ page }) => {
  test.skip(process.platform !== 'darwin', 'Las capturas de referencia son de macOS.')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?invitation=264018')
  await expect(page.getByRole('status')).toContainText('todavía no está disponible')
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('web-invite-unavailable-390.png', { animations: 'disabled' })
})
