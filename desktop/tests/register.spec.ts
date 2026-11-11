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

const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']
const dayLetters = ['L', 'M', 'X', 'J', 'V']
const weekMarkLabels: Record<string, string[]> = {
  lunes: Array.from({ length: 10 }, () => 'Presente').concat('Retraso', 'Ausencia'),
  martes: Array.from({ length: 10 }, () => 'Presente').concat('Ausencia', 'Ausencia'),
  miércoles: Array.from({ length: 10 }, () => 'Presente').concat('Retraso', 'Ausencia'),
  jueves: Array.from({ length: 11 }, () => 'Presente').concat('Ausencia'),
  viernes: Array.from({ length: 11 }, () => 'Presente').concat('Retraso')
}
const registerErrorPhrases = [
  'El nombre es obligatorio.',
  'El correo es obligatorio.',
  'El correo no tiene una forma válida.',
  'La contraseña es obligatoria.',
  'La contraseña tiene que tener al menos 8 caracteres.'
]
const loginOnlyPhrases = ['Tu trimestre, sesión a sesión', 'Entra con tu correo.', 'Entrar']
const absentFromRegister = ['Términos', 'términos', 'Privacidad', 'privacidad']

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

function envWithScreen(screen: string): Record<string, string> {
  const env: Record<string, string> = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== 'ELECTRON_RUN_AS_NODE') {
      env[key] = value
    }
  }

  env.ATEMPO_SCREEN = screen
  return env
}

function markClassForLabel(label: string | null): string {
  if (label === 'Presente') {
    return 'status-success'
  }

  if (label === 'Retraso') {
    return 'status-warning'
  }

  if (label === 'Ausencia') {
    return 'status-error'
  }

  return 'missing-mark'
}

async function openApp(screen: string): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', mainFile],
    cwd: appRoot,
    env: envWithScreen(screen)
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 960, height: 720 })
  await window.evaluate(() => document.fonts.ready)
  return { app, window }
}

async function withApp(screen: string, run: (window: Page) => Promise<void>): Promise<void> {
  const { app, window } = await openApp(screen)
  try {
    await run(window)
  } finally {
    await app.close()
  }
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

async function expectSingleClaim(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(
    window.getByRole('heading', { name: 'Pasar lista ya no es parte de la clase.' })
  ).toBeVisible()
}

async function expectOrganizeParagraphBetweenClaimAndWeek(window: Page): Promise<void> {
  const paragraph = window.getByText('Organiza cada sesión.', { exact: true })
  const week = window.getByRole('heading', { name: 'Esta semana', level: 2 })

  await expect(paragraph).toBeVisible()
  await expect(week).toBeVisible()

  const claimBox = await readBox(window.locator('#claim'))
  const paragraphBox = await readBox(paragraph)
  const weekBox = await readBox(week)
  expect(claimBox.y + claimBox.height).toBeLessThanOrEqual(paragraphBox.y)
  expect(paragraphBox.y + paragraphBox.height).toBeLessThanOrEqual(weekBox.y)

  const inOrder = await paragraph.evaluate((node) => {
    const claim = document.getElementById('claim')
    const weekHeading = document.querySelector('h2')
    if (claim === null || weekHeading === null) {
      return false
    }

    const afterClaim =
      (claim.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    const beforeWeek =
      (node.compareDocumentPosition(weekHeading) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    return afterClaim && beforeWeek && weekHeading.textContent === 'Esta semana'
  })
  expect(inOrder).toBe(true)
}

async function expectWeek(window: Page): Promise<void> {
  await expect(window.getByText('94% presentes', { exact: true })).toBeVisible()

  const days = window.getByRole('listitem', {
    name: /^(lunes|martes|miércoles|jueves|viernes)$/
  })
  await expect(days).toHaveCount(5)

  const names = await days.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('aria-label'))
  )
  expect(names).toEqual(dayNames)

  const letters = await days.evaluateAll((nodes) =>
    nodes.map((node) => (node.textContent ?? '').replace(/\s+/g, ''))
  )
  expect(letters).toEqual(dayLetters)

  for (const name of dayNames) {
    const marks = window.getByRole('listitem', { name }).getByRole('img')
    const details = await marks.evaluateAll((nodes) =>
      nodes.map((node) => ({
        label: node.getAttribute('aria-label'),
        className: node.className
      }))
    )
    expect(details.map((mark) => mark.label)).toEqual(weekMarkLabels[name])

    for (const mark of details) {
      expect(mark.className).toContain(markClassForLabel(mark.label))
    }
  }
}

async function expectLegend(window: Page): Promise<void> {
  const legend = window.getByRole('list').filter({ hasText: 'Presente' })
  await expect(legend.getByRole('listitem')).toHaveText(['Presente', 'Retraso', 'Ausencia'])
}

async function expectRegisterFields(window: Page): Promise<void> {
  await expect(window.getByLabel('Nombre completo')).toBeVisible()
  await expect(window.getByLabel('Correo electrónico')).toBeVisible()
  await expect(window.getByLabel('Contraseña')).toBeVisible()
  await expect(window.getByRole('button', { name: 'Crear mi cuenta' })).toBeVisible()
  await expect(window.locator('form')).toHaveAttribute('novalidate', '')
}

async function expectNoLogin(window: Page): Promise<void> {
  const text = await window.locator('body').innerText()
  for (const phrase of loginOnlyPhrases) {
    expect(text).not.toContain(phrase)
  }
}

async function expectNoTerms(window: Page): Promise<void> {
  const text = await window.locator('body').innerText()
  for (const phrase of absentFromRegister) {
    expect(text).not.toContain(phrase)
  }
  await expect(window.getByRole('checkbox')).toHaveCount(0)
}

async function expectNoAlert(window: Page): Promise<void> {
  await expect(window.getByRole('status')).toHaveCount(0)
}

async function expectNoRegisterErrors(window: Page): Promise<void> {
  for (const phrase of registerErrorPhrases) {
    await expect(window.getByText(phrase)).toHaveCount(0)
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

async function expectSignInButton(window: Page): Promise<void> {
  const signIn = window.getByRole('button', { name: 'Inicia sesión' })
  await expect(signIn).toBeVisible()
  await expect(signIn).toHaveAttribute('type', 'button')
  await expect(window.getByRole('link', { name: 'Inicia sesión' })).toHaveCount(0)
  await expect(window.getByText('¿Ya tienes una cuenta?')).toBeVisible()
}

async function expectLoginScreen(window: Page): Promise<void> {
  await expect(window.getByText('aTempo')).toBeVisible()
  await expect(window.getByRole('heading', { name: 'Tu trimestre, sesión a sesión' })).toBeVisible()
  await expect(
    window.getByRole('heading', { name: 'Pasar lista ya no es parte de la clase.' })
  ).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await expect(window.getByText('Organiza cada sesión.')).toHaveCount(0)
  await expect(window.getByRole('heading', { name: 'Esta semana' })).toHaveCount(0)
  await expect(window.getByRole('button', { name: 'Crear mi cuenta' })).toHaveCount(0)
  await expect(window.getByText('94% presentes')).toHaveCount(0)
}

test('shows the week panel beside the register form', async () => {
  await withApp('register', async (window) => {
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-oscuro')
    await expect(window.getByText('aTempo')).toBeVisible()
    await expectSingleClaim(window)
    await expectOrganizeParagraphBetweenClaimAndWeek(window)
    await expectWeek(window)
    await expectLegend(window)
    await expectRegisterFields(window)
    await expectPanelLeftOfForm(window)
    await expectNoLogin(window)
    await expectNoTerms(window)
    await expectNoAlert(window)
    await expect(window).toHaveScreenshot('register-empty.png', { animations: 'disabled' })
  })
})

test('shows name, email and password errors when the fields are empty', async () => {
  await withApp('register', async (window) => {
    await window.getByRole('button', { name: 'Crear mi cuenta' }).click()

    await expect(window.getByText('El nombre es obligatorio.')).toBeVisible()
    await expect(window.getByText('El correo es obligatorio.')).toBeVisible()
    await expect(window.getByText('La contraseña es obligatoria.')).toBeVisible()
    await expect(window.getByText('El correo no tiene una forma válida.')).toHaveCount(0)
    await expect(
      window.getByText('La contraseña tiene que tener al menos 8 caracteres.')
    ).toHaveCount(0)
    await expect(window.getByLabel('Nombre completo')).toHaveAttribute('aria-invalid', 'true')
    await expect(window.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
    await expect(window.getByLabel('Contraseña')).toHaveAttribute('aria-invalid', 'true')
    await expectNoAlert(window)
    await expect(window).toHaveScreenshot('register-errors.png', { animations: 'disabled' })
  })
})

test('shows errors for a malformed email and a short password', async () => {
  await withApp('register', async (window) => {
    const name = window.getByLabel('Nombre completo')
    const email = window.getByLabel('Correo electrónico')
    const password = window.getByLabel('Contraseña')
    const submit = window.getByRole('button', { name: 'Crear mi cuenta' })

    await name.fill('Ana')
    await email.fill('ana')
    await password.fill('1234567')
    await submit.click()

    await expect(window.getByText('El nombre es obligatorio.')).toHaveCount(0)
    await expect(name).not.toHaveAttribute('aria-invalid', 'true')
    await expect(window.getByText('El correo no tiene una forma válida.')).toBeVisible()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(window.getByText('El correo es obligatorio.')).toHaveCount(0)
    await expect(
      window.getByText('La contraseña tiene que tener al menos 8 caracteres.')
    ).toBeVisible()
    await expect(window.getByText('La contraseña es obligatoria.')).toHaveCount(0)
    await expect(password).toHaveAttribute('aria-invalid', 'true')
    await expectNoAlert(window)

    await name.fill('   ')
    await email.fill('   ')
    await password.fill('12345678')
    await submit.click()

    await expect(window.getByText('El nombre es obligatorio.')).toBeVisible()
    await expect(window.getByText('El correo es obligatorio.')).toBeVisible()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(window.getByText('El correo no tiene una forma válida.')).toHaveCount(0)
    await expect(
      window.getByText('La contraseña tiene que tener al menos 8 caracteres.')
    ).toHaveCount(0)
    await expect(window.getByText('La contraseña es obligatoria.')).toHaveCount(0)
    await expect(password).not.toHaveAttribute('aria-invalid', 'true')
    await expectNoAlert(window)

    await name.fill('Ana')
    await email.fill('ana@clase.test')
    await password.fill(' ')
    await submit.click()

    await expect(window.getByText('El nombre es obligatorio.')).toHaveCount(0)
    await expect(window.getByText('El correo es obligatorio.')).toHaveCount(0)
    await expect(window.getByText('El correo no tiene una forma válida.')).toHaveCount(0)
    await expect(window.getByText('La contraseña es obligatoria.')).toHaveCount(0)
    await expect(
      window.getByText('La contraseña tiene que tener al menos 8 caracteres.')
    ).toBeVisible()
    await expect(password).toHaveAttribute('aria-invalid', 'true')
    await expectNoAlert(window)

    await password.fill('123 567')
    await submit.click()

    await expect(
      window.getByText('La contraseña tiene que tener al menos 8 caracteres.')
    ).toBeVisible()
    await expect(window.getByText('La contraseña es obligatoria.')).toHaveCount(0)
    await expectNoAlert(window)

    await password.fill('12345678')
    await submit.click()

    const alert = window.getByRole('status')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('Nombre completo: Ana')
    await expect(alert).toContainText('Correo electrónico: ana@clase.test')
    await expect(alert).toContainText('Contraseña: 12345678')
    await expectNoRegisterErrors(window)

    await password.fill(' 1234567')
    await submit.click()

    const lines = await alert
      .locator('span')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent))
    expect(lines).toEqual([
      'Nombre completo: Ana',
      'Correo electrónico: ana@clase.test',
      'Contraseña:  1234567'
    ])
    await expectNoRegisterErrors(window)
  })
})

test('shows the written name, email and password in an alert', async () => {
  await withApp('register', async (window) => {
    await window.getByLabel('Nombre completo').fill('Ana')
    await window.getByLabel('Correo electrónico').fill('ana@clase.test')
    await window.getByLabel('Contraseña').fill('secreta12')
    await window.getByRole('button', { name: 'Crear mi cuenta' }).click()

    const alert = window.getByRole('status')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveClass(/alert/)
    await expect(alert).toHaveClass(/alert-success/)
    await expect(alert).toContainText('Nombre completo: Ana')
    await expect(alert).toContainText('Correo electrónico: ana@clase.test')
    await expect(alert).toContainText('Contraseña: secreta12')
    await expectNoRegisterErrors(window)
    await expect(window).toHaveScreenshot('register-alert.png', { animations: 'disabled' })

    await window.getByLabel('Nombre completo').fill('  Ana  ')
    await window.getByLabel('Correo electrónico').fill('  ana@clase.test  ')
    await window.getByLabel('Contraseña').fill(' secreta12')
    await window.getByRole('button', { name: 'Crear mi cuenta' }).click()

    const lines = await alert
      .locator('span')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent))
    expect(lines).toEqual([
      'Nombre completo: Ana',
      'Correo electrónico: ana@clase.test',
      'Contraseña:  secreta12'
    ])

    await window.getByLabel('Nombre completo').fill('Ana María')
    await expectNoAlert(window)
  })
})

test('does not leave the register screen when Inicia sesión is pressed', async () => {
  await withApp('register', async (window) => {
    await expectSignInButton(window)
    await window.getByLabel('Nombre completo').fill('Ana')
    await window.getByLabel('Correo electrónico').fill('ana@clase.test')
    await window.getByLabel('Contraseña').fill('secreta12')
    await window.getByRole('button', { name: 'Inicia sesión' }).click()

    await expect(window.getByRole('heading', { name: 'Esta semana' })).toBeVisible()
    await expect(window.getByText('Organiza cada sesión.', { exact: true })).toBeVisible()
    await expect(window.getByRole('button', { name: 'Crear mi cuenta' })).toBeVisible()
    await expectNoLogin(window)
    await expectNoAlert(window)
    await expectNoRegisterErrors(window)
    const search = await window.evaluate(() => window.location.search)
    expect(search).toContain('screen=register')
  })
})

test('stacks the panel and the form when the window is narrow', async () => {
  await withApp('register', async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })

    await expectSingleClaim(window)
    await expectOrganizeParagraphBetweenClaimAndWeek(window)
    await expectWeek(window)
    await expectLegend(window)
    await expectRegisterFields(window)
    await expectSignInButton(window)
    await expectPanelAboveForm(window)
    await expectNoLogin(window)
    await expect(window).toHaveScreenshot('register-narrow.png', { animations: 'disabled' })
  })
})

test('changes colors and font with the light theme', async () => {
  await withApp('register', async (window) => {
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-oscuro')
    const dark = await readBodyStyle(window)

    await window.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'atempo-claro')
    })
    await window.evaluate(() => document.fonts.ready)

    const light = await readBodyStyle(window)
    expect(light.fontFamily).toContain('Inter')
    expect(light.backgroundColor).not.toBe(dark.backgroundColor)

    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-claro')
    await expectSingleClaim(window)
    await expectOrganizeParagraphBetweenClaimAndWeek(window)
    await expectRegisterFields(window)
    await expectPanelLeftOfForm(window)
    await expect(window.getByRole('button', { name: /tema|theme/i })).toHaveCount(0)
    await expect(window).toHaveScreenshot('register-claro.png', { animations: 'disabled' })
  })
})

test('shows and hides the password', async () => {
  await withApp('register', async (window) => {
    const password = window.getByLabel('Contraseña')
    await window.getByLabel('Nombre completo').fill('Ana')
    await window.getByLabel('Correo electrónico').fill('ana@clase.test')
    await password.fill('secreta12')
    await expect(password).toHaveAttribute('type', 'password')
    await expect(password).toHaveValue('secreta12')

    const showPassword = window.getByRole('button', { name: 'Mostrar' })
    await expect(showPassword).toBeVisible()
    await expect(showPassword).toHaveAttribute('type', 'button')
    await showPassword.click()

    await expect(password).toHaveAttribute('type', 'text')
    await expect(password).toHaveValue('secreta12')
    const hidePassword = window.getByRole('button', { name: 'Ocultar' })
    await expect(hidePassword).toBeVisible()
    await expect(hidePassword).toHaveAttribute('type', 'button')
    await expectNoAlert(window)
    await expectNoRegisterErrors(window)

    await hidePassword.click()

    await expect(password).toHaveAttribute('type', 'password')
    await expect(password).toHaveValue('secreta12')
    await expect(window.getByRole('button', { name: 'Mostrar' })).toBeVisible()
    await expectNoAlert(window)
    await expectNoRegisterErrors(window)
  })
})

test('keeps the login screen when ATEMPO_SCREEN is not register', async () => {
  test.setTimeout(60_000)

  for (const screen of ['Register', '', 'login']) {
    await withApp(screen, async (window) => {
      await expectLoginScreen(window)
    })
  }
})
