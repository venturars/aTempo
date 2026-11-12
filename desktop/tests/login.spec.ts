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

function loginSnapshot(name: string): string | string[] {
  return process.platform === 'win32' ? ['win32', name] : name
}

const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']
const dayLetters = ['L', 'M', 'X', 'J', 'V']
const sessionMarkLabels = Array.from({ length: 12 }, () => 'Presente').concat('Retraso', 'Ausencia')
const absentFromScreen = [
  'Google',
  'Microsoft',
  'olvid',
  'Mantener la sesión',
  'demo',
  'Privacidad',
  'Términos',
  'Ayuda',
  '¿Ya tienes una cuenta?',
  'Crear mi cuenta'
]
const errorPhrases = [
  'El correo es obligatorio.',
  'La contraseña es obligatoria.',
  'El correo no tiene una forma válida.'
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

async function withApp(run: (window: Page) => Promise<void>): Promise<void> {
  const { app, window } = await openApp()
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

async function expectTrimester(window: Page): Promise<void> {
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
    await expect(marks).toHaveCount(14)
    const labels = await marks.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('aria-label'))
    )
    expect(labels).toEqual(sessionMarkLabels)
  }
}

async function expectLegend(window: Page): Promise<void> {
  const legend = window.getByRole('list').filter({ hasText: 'Presente' })
  await expect(legend.getByRole('listitem')).toHaveText(['Presente', 'Retraso', 'Ausencia'])
}

async function expectLoginFields(window: Page): Promise<void> {
  await expect(window.getByText('Entra con tu correo.')).toBeVisible()
  await expect(window.getByLabel('Correo')).toBeVisible()
  await expect(window.getByLabel('Contraseña')).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
}

async function expectSingleClaim(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(
    window.getByRole('heading', { name: 'Pasar lista ya no es parte de la clase.' })
  ).toBeVisible()
}

async function expectNoAlert(window: Page): Promise<void> {
  await expect(window.getByRole('status')).toHaveCount(0)
}

async function expectNoErrorPhrases(window: Page): Promise<void> {
  for (const phrase of errorPhrases) {
    await expect(window.getByText(phrase)).toHaveCount(0)
  }
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

test('shows the claim panel beside the form', async () => {
  await withApp(async (window) => {
    const hash = await window.evaluate(() => window.location.hash)
    expect(hash).toBe('')
    await expect(window.getByRole('heading', { name: 'Dashboard alumno' })).toHaveCount(0)
    await expect(window.getByRole('heading', { name: 'Esta semana' })).toHaveCount(0)
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-oscuro')
    await expect(window.getByText('aTempo')).toBeVisible()
    await expect(
      window.getByRole('heading', { name: 'Tu trimestre, sesión a sesión' })
    ).toBeVisible()
    await expectSingleClaim(window)
    await expectTrimester(window)
    await expectLegend(window)
    await expectLoginFields(window)
    await expectPanelLeftOfForm(window)
    await expectNoAlert(window)
    await expectAbsentCopy(window)
    await expect(window).toHaveScreenshot(loginSnapshot('login-empty.png'), {
      animations: 'disabled'
    })
  })
})

test('shows both errors when the fields are empty', async () => {
  await withApp(async (window) => {
    await window.getByRole('button', { name: 'Entrar' }).click()

    await expect(window.getByText('El correo es obligatorio.')).toBeVisible()
    await expect(window.getByText('La contraseña es obligatoria.')).toBeVisible()
    await expect(window.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true')
    await expect(window.getByLabel('Contraseña')).toHaveAttribute('aria-invalid', 'true')
    await expectNoAlert(window)
    await expect(window).toHaveScreenshot(loginSnapshot('login-errors.png'), {
      animations: 'disabled'
    })
  })
})

test('shows the written email and password in an alert', async () => {
  await withApp(async (window) => {
    const hash = await window.evaluate(() => window.location.hash)
    await window.getByLabel('Correo').fill('ana@clase.test')
    await window.getByLabel('Contrase\u00f1a').fill('secreta')
    await window.getByRole('button', { name: 'Entrar' }).click()
    await expect(window.getByRole('status')).toContainText('Correo: ana@clase.test')
    await expect(window.getByRole('status')).toContainText('Contrase\u00f1a: secreta')
    expect(await window.evaluate(() => window.location.hash)).toBe(hash)
    await expectLoginFields(window)
    await expect(window.getByRole('heading', { name: 'Resumen', level: 1 })).toHaveCount(0)
    await expectNoErrorPhrases(window)
    await expect(window).toHaveScreenshot(loginSnapshot('login-alert.png'), {
      animations: 'disabled'
    })
  })
})

test('stacks the panel and the form when the window is narrow', async () => {
  await withApp(async (window) => {
    await window.setViewportSize({ width: 390, height: 844 })

    await expectSingleClaim(window)
    await expectTrimester(window)
    await expectLegend(window)
    await expectLoginFields(window)
    await expectPanelAboveForm(window)
    await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(window).toHaveScreenshot(loginSnapshot('login-narrow.png'), {
      animations: 'disabled'
    })
  })
})

test('changes colors and font with the light theme', async () => {
  await withApp(async (window) => {
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
    await expectTrimester(window)
    await expectLoginFields(window)
    await expectPanelLeftOfForm(window)
    await expect(window.getByRole('button', { name: /tema|theme/i })).toHaveCount(0)
    await expect(window).toHaveScreenshot(loginSnapshot('login-claro.png'), {
      animations: 'disabled'
    })
  })
})

test('shows an error when the email has no email shape', async () => {
  await withApp(async (window) => {
    await window.getByLabel('Correo').fill('ana')
    await window.getByLabel('Contraseña').fill('secreta')
    await window.getByRole('button', { name: 'Entrar' }).click()

    await expect(window.getByText('El correo no tiene una forma válida.')).toBeVisible()
    await expectNoAlert(window)
  })
})
