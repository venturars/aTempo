import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test'
import es from '../../web/src/locales/es.json'
import en from '../../web/src/locales/en.json'

type Tree = { [key: string]: string | Tree }

// Una mañana de clase fija: las capturas no dependen de la hora del ordenador.
const classMorning = new Date('2026-11-11T08:40:00+01:00')

// Cada texto de un JSON con su ruta: «account.history» → «Resumen».
function leaves(tree: Tree, path = ''): Map<string, string | Tree> {
  const found = new Map<string, string | Tree>()
  for (const [key, value] of Object.entries(tree)) {
    const where = path === '' ? key : `${path}.${key}`
    const isPlural = typeof value === 'object' && 'other' in value
    if (typeof value === 'string' || isPlural) {
      found.set(where, value)
    } else {
      leaves(value, where).forEach((text, child) => found.set(child, text))
    }
  }
  return found
}

function holes(entry: string | Tree): string {
  const texts = typeof entry === 'string' ? [entry] : Object.values(entry).map(String)
  const names = texts.flatMap((text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))
  return [...new Set(names)].sort().join(',')
}

// La web exige Auth0: el router se simula con la cuenta de Ada, como en web-auth0.spec.ts.
async function mockStudentSession(context: BrowserContext): Promise<void> {
  let signedIn = false
  await context.route(/\/api\/auth\/(login|me|refresh|logout)$/, async (route: Route) => {
    const { pathname } = new URL(route.request().url())
    const session = { email: 'ada.lopez@clase.test', profile: 'student' }
    if (pathname.endsWith('/login')) {
      signedIn = true
      await route.fulfill({
        status: 200,
        json: session,
        headers: { 'set-cookie': 'atempo_access=test-access; Path=/; HttpOnly; SameSite=Lax' }
      })
      return
    }
    if (pathname.endsWith('/logout')) {
      signedIn = false
      await route.fulfill({ status: 200, json: { success: true } })
      return
    }
    await route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? session : {} })
  })
}

async function signIn(page: Page, submit: string): Promise<void> {
  await page.locator('#email').fill('ada.lopez@clase.test')
  await page.locator('#password').fill('auth0-password')
  await page.getByRole('button', { name: submit, exact: true }).click()
}

test.beforeEach(async ({ context, page }) => {
  await mockStudentSession(context)
  await page.clock.setFixedTime(classMorning)
})

test('es.json and en.json have the same keys, plurals and placeholders', () => {
  const spanish = leaves(es as Tree)
  const english = leaves(en as Tree)
  expect([...english.keys()].sort()).toEqual([...spanish.keys()].sort())
  for (const [key, text] of spanish) {
    const translated = english.get(key)!
    expect(typeof translated, key).toBe(typeof text)
    expect(holes(translated), key).toBe(holes(text))
  }
})

test.describe('with an English browser', () => {
  test.use({ locale: 'en-GB' })

  test('follows the browser language', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    const picker = page.getByRole('group', { name: 'Language' })
    await expect(picker.getByRole('button', { name: 'Device' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  // Las capturas se hacen en macOS, como las de Electron: en Linux cambian las fuentes.
  test('matches the student screens in English at 390 px', async ({ page }) => {
    test.skip(process.platform !== 'darwin', 'Las capturas de referencia son de macOS.')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await expect(page).toHaveScreenshot('web-language-login-en.png', { animations: 'disabled' })
    await signIn(page, 'Sign in')
    await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible()
    // Tempito se mueve fotograma a fotograma desde el código: se tapa en la captura.
    await expect(page).toHaveScreenshot('web-language-home-en.png', {
      animations: 'disabled',
      mask: [page.locator('svg.mascot')]
    })
    await page.getByRole('link', { name: 'Summary' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Your attendance' })).toBeVisible()
    await expect(page).toHaveScreenshot('web-language-history-en.png', {
      animations: 'disabled',
      fullPage: true
    })
  })
})

test.describe('with a French browser', () => {
  test.use({ locale: 'fr-FR' })

  test('falls back to Spanish', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  })
})

test.describe('with a US browser', () => {
  test.use({ locale: 'en-US' })

  test('writes the history dates in US English', async ({ page }) => {
    await page.goto('/')
    await signIn(page, 'Sign in')
    await page.getByRole('link', { name: 'Summary' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Your attendance' })).toBeVisible()
    await expect(page.getByText('Nov 10', { exact: true }).first()).toBeVisible()
  })
})

test('changes the language from the login header', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
})

test('changes the language in the account menu, keeps it and goes back to the browser', async ({
  page
}) => {
  await page.goto('/')
  await signIn(page, 'Entrar')
  await page.getByLabel('Cuenta').click()
  await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible()

  await page.getByLabel('Account').click()
  await page
    .getByRole('group', { name: 'Language' })
    .getByRole('button', { name: 'Device' })
    .click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('link', { name: 'Resumen' })).toBeVisible()
})
