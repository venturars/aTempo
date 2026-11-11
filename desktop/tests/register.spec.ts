import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Locator,
  type Page
} from '@playwright/test'
import path from 'node:path'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out', 'main', 'index.js')

const absentFromScreen = [
  'términos',
  'privacidad',
  'Inicia sesión',
  'Google',
  'EMPIEZA GRATIS',
  'presentes'
]

type Box = {
  x: number
  y: number
  width: number
  height: number
}

type BodyStyle = {
  fontFamily: string
  backgroundColor: string
}

async function openRegisterScreen(): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', mainFile],
    cwd: appRoot
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 960, height: 720 })
  await window.evaluate(() => {
    window.location.hash = 'registro'
    window.location.reload()
  })
  await window.waitForLoadState('load')
  await window.getByRole('heading', { name: 'Crea tu cuenta' }).waitFor()
  await window.evaluate(() => document.fonts.ready)
  return { app, window }
}

async function withRegisterScreen(run: (window: Page) => Promise<void>): Promise<void> {
  const { app, window } = await openRegisterScreen()
  try {
    await run(window)
  } finally {
    await app.close()
  }
}

function nameField(window: Page): Locator {
  return window.getByLabel('Nombre completo')
}

function emailField(window: Page): Locator {
  return window.getByLabel('Correo electrónico')
}

function passwordField(window: Page): Locator {
  return window.getByLabel('Contraseña', { exact: true })
}

function createButton(window: Page): Locator {
  return window.getByRole('button', { name: 'Crear mi cuenta' })
}

function claimPanel(window: Page): Locator {
  return window.locator('section').filter({ has: window.locator('#claim') })
}

async function readBox(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (box === null) {
    throw new Error('El elemento no tiene recuadro.')
  }
  return box
}

async function expectPanelLeftOfForm(window: Page): Promise<void> {
  const panelBox = await readBox(claimPanel(window))
  const formBox = await readBox(window.locator('form'))
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(formBox.x)
}

async function expectPanelAboveForm(window: Page): Promise<void> {
  const panelBox = await readBox(claimPanel(window))
  const formBox = await readBox(window.locator('form'))
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(formBox.y)
}

async function expectRegisterFields(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible()
  await expect(
    window.getByText('Empieza a gestionar tu clase en menos de un minuto.')
  ).toBeVisible()
  await expect(nameField(window)).toBeVisible()
  await expect(emailField(window)).toBeVisible()
  await expect(passwordField(window)).toBeVisible()
  await expect(createButton(window)).toBeVisible()
}

async function expectNoAlert(window: Page): Promise<void> {
  await expect(window.getByRole('status')).toHaveCount(0)
}

async function expectAbsentCopy(window: Page): Promise<void> {
  const text = await window.locator('body').innerText()
  for (const phrase of absentFromScreen) {
    expect(text).not.toContain(phrase)
  }
}

function readBodyStyle(window: Page): Promise<BodyStyle> {
  return window.locator('body').evaluate((body) => {
    const style = getComputedStyle(body)
    return {
      fontFamily: style.fontFamily,
      backgroundColor: style.backgroundColor
    }
  })
}

test('shows the claim panel beside the register form', async () => {
  await withRegisterScreen(async (window) => {
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-oscuro')
    await expect(
      window.getByRole('heading', { name: 'Pasar lista ya no es parte de la clase.' })
    ).toBeVisible()
    await expectRegisterFields(window)
    await expectPanelLeftOfForm(window)
    await expect(window.locator('.btn-primary')).toHaveCount(1)
    await expectNoAlert(window)
    await expectAbsentCopy(window)
    await expect(window).toHaveScreenshot('register-empty.png', { animations: 'disabled' })
  })
})

test('shows the three errors when the fields are empty', async () => {
  await withRegisterScreen(async (window) => {
    await createButton(window).click()

    await expect(window.getByText('El nombre es obligatorio.')).toBeVisible()
    await expect(window.getByText('El correo es obligatorio.')).toBeVisible()
    await expect(window.getByText('La contraseña es obligatoria.')).toBeVisible()
    await expect(nameField(window)).toHaveAttribute('aria-invalid', 'true')
    await expect(emailField(window)).toHaveAttribute('aria-invalid', 'true')
    await expect(passwordField(window)).toHaveAttribute('aria-invalid', 'true')
    await expectNoAlert(window)
    await expect(window).toHaveScreenshot('register-errors.png', { animations: 'disabled' })
  })
})

test('shows an error for a bad email and a short password', async () => {
  await withRegisterScreen(async (window) => {
    await nameField(window).fill('Ana Ruiz')
    await emailField(window).fill('ana')
    await passwordField(window).fill('corta')
    await createButton(window).click()

    await expect(window.getByText('El correo no tiene una forma válida.')).toBeVisible()
    await expect(window.getByText('La contraseña necesita 8 caracteres o más.')).toBeVisible()
    await expect(window.getByText('El nombre es obligatorio.')).toHaveCount(0)
    await expectNoAlert(window)
  })
})

test('shows and hides the password', async () => {
  await withRegisterScreen(async (window) => {
    await passwordField(window).fill('secreta123')
    await expect(passwordField(window)).toHaveAttribute('type', 'password')

    await window.getByRole('button', { name: 'Mostrar' }).click()
    await expect(passwordField(window)).toHaveAttribute('type', 'text')
    await expect(window.getByRole('button', { name: 'Ocultar' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    await window.getByRole('button', { name: 'Ocultar' }).click()
    await expect(passwordField(window)).toHaveAttribute('type', 'password')
    await expect(window.getByRole('button', { name: 'Mostrar' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})

test('shows the created account in an alert', async () => {
  await withRegisterScreen(async (window) => {
    await nameField(window).fill('Ana Ruiz')
    await emailField(window).fill('ana@clase.test')
    await passwordField(window).fill('secreta123')
    await createButton(window).click()

    await expect(window.getByRole('status')).toHaveText(
      'Cuenta creada para Ana Ruiz (ana@clase.test).'
    )
    await expect(window).toHaveScreenshot('register-alert.png', { animations: 'disabled' })
  })
})

test('stacks the panel and the register form when the window is narrow', async () => {
  await withRegisterScreen(async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })

    await expectRegisterFields(window)
    await expectPanelAboveForm(window)
    await expect(window).toHaveScreenshot('register-narrow.png', { animations: 'disabled' })
  })
})

test('changes colors and font of the register screen with the light theme', async () => {
  await withRegisterScreen(async (window) => {
    const dark = await readBodyStyle(window)

    await window.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'atempo-claro')
    })
    await window.evaluate(() => document.fonts.ready)

    const light = await readBodyStyle(window)
    expect(light.fontFamily).toContain('Inter')
    expect(light.backgroundColor).not.toBe(dark.backgroundColor)

    await expectRegisterFields(window)
    await expectPanelLeftOfForm(window)
    await expect(window).toHaveScreenshot('register-claro.png', { animations: 'disabled' })
  })
})
