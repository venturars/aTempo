import { expect, test } from '@playwright/test'

// La web del alumno solo se abre por invitación: el enlace del correo pide la contraseña la primera vez.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('has no open sign-up', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Hola de nuevo' })).toBeVisible()
  await expect(page.getByText('Crear mi cuenta')).toHaveCount(0)
  await page.goto('/sign-up')
  await expect(page.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toHaveCount(0)
})

test('activates the invitation, signs out and signs back in with the new password', async ({
  page
}) => {
  await page.goto('/?invitation=264018')
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Bruno' })).toBeVisible()
  await expect(page.getByText('bruno.sanz@clase.test')).toBeVisible()

  await expect(page.getByLabel('Nombre')).toHaveValue('Bruno')
  await expect(page.getByLabel('Apellidos')).toHaveValue('Sanz')

  await page.getByLabel('Nombre').fill('')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('El nombre es obligatorio.')).toBeVisible()
  await expect(page.getByText('El documento de identidad es obligatorio.')).toBeVisible()
  await expect(page.getByText('La contraseña es obligatoria.')).toBeVisible()

  await page.getByLabel('Nombre').fill('Bruno')
  await page.getByLabel('Documento de identidad').fill(' 12345678z ')
  await page.getByLabel('Contraseña').fill('corta')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('La contraseña tiene que tener al menos 8 caracteres.')).toBeVisible()

  await page.getByLabel('Contraseña').fill('bruno-2026')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/student\/dashboard$/)
  const saved = await page.evaluate(() => localStorage.getItem('atempo-student-accounts') ?? '')
  expect(saved).toContain('"identificationDocument":"12345678Z"')
  expect(saved).toContain('"lastName":"Sanz"')

  await page.goto('/?invitation=264018')
  await expect(
    page.getByText('Esta invitación ya está activada. Entra con tu contraseña.')
  ).toBeVisible()
  await page.getByLabel('Correo').fill('bruno.sanz@clase.test')
  await page.getByLabel('Contraseña').fill('bruno-2026')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/student\/dashboard$/)
})

test('warns about an unknown invitation link', async ({ page }) => {
  await page.goto('/?invitation=000000')
  await expect(page.getByText('Este enlace de invitación no es válido.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Hola de nuevo' })).toBeVisible()
})
