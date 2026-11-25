import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import es from '../src/renderer/src/locales/es.json'
import en from '../src/renderer/src/locales/en.json'
import { launchHiddenElectron } from './helpers/electron'

type Tree = { [key: string]: string | Tree }

// Cada texto de un JSON con su ruta: «panel.today.openList» → «Abrir lista».
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

async function withApp(
  lang: string,
  run: (window: Page, app: ElectronApplication) => Promise<void>
): Promise<void> {
  const app = await launchHiddenElectron([`--test-lang=${lang}`])
  try {
    const window = await app.firstWindow()
    await window.setViewportSize({ width: 1280, height: 800 })
    await expect(window.getByRole('heading', { level: 1 })).toBeVisible()
    await run(window, app)
  } finally {
    await app.close()
  }
}

async function logIn(window: Page, email: string, password: string, submit: string): Promise<void> {
  await window.locator('#email').fill(email)
  await window.locator('#password').fill(password)
  await window.getByRole('button', { name: submit, exact: true }).click()
}

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

test('follows an English system language', async () => {
  await withApp('en-GB', async (window) => {
    await expect(window.locator('html')).toHaveAttribute('lang', 'en')
    await expect(window.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()
    const picker = window.getByRole('group', { name: 'Language' })
    await expect(picker.getByRole('button', { name: 'Device' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})

test('falls back to Spanish when the system language is not supported', async () => {
  await withApp('fr-FR', async (window) => {
    await expect(window.locator('html')).toHaveAttribute('lang', 'es')
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  })
})

test('changes the language from the login card', async () => {
  await withApp('es-ES', async (window) => {
    await window
      .getByRole('group', { name: 'Idioma' })
      .getByRole('button', { name: 'English' })
      .click()
    await expect(window.locator('html')).toHaveAttribute('lang', 'en')
    await expect(window.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()
  })
})

test('changes the language in Ajustes, keeps it and goes back to the system', async () => {
  await withApp('es-ES', async (window) => {
    await logIn(window, 'profesor@atempo.test', 'Profesor123!', 'Entrar')
    await window.getByRole('button', { name: 'Ajustes' }).click()
    const card = window.getByRole('region', { name: 'Idioma' })
    await card.getByRole('button', { name: 'English' }).click()
    await expect(window.locator('html')).toHaveAttribute('lang', 'en')
    await expect(window.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()

    await window
      .getByRole('region', { name: 'Language' })
      .getByRole('button', { name: 'Device' })
      .click()
    await expect(window.locator('html')).toHaveAttribute('lang', 'es')
    await expect(window.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible()

    await card.getByRole('button', { name: 'English' }).click()
    await window.reload()
    await expect(window.locator('html')).toHaveAttribute('lang', 'en')
  })
})

test('writes arrival times in the 12-hour format of a US system', async () => {
  await withApp('en-US', async (window) => {
    await logIn(window, 'profesor@atempo.test', 'Profesor123!', 'Log in')
    await expect(window.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
    await window.getByRole('button', { name: 'Open register', exact: true }).click()
    await window.getByRole('button', { name: 'Simulate arrival', exact: true }).click()
    await expect(
      window
        .getByRole('row')
        .filter({ hasText: /\d{1,2}:\d{2}\s?[AP]M/ })
        .first()
    ).toBeVisible()
  })
})

test('matches the main screens in English', async () => {
  await withApp('en-GB', async (window) => {
    await window.evaluate(() => document.fonts.ready)
    await expect(window).toHaveScreenshot('language-login-en.png', { animations: 'disabled' })
    await logIn(window, 'profesor@atempo.test', 'Profesor123!', 'Log in')
    await expect(window.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
    await expect(window).toHaveScreenshot('language-today-en.png', { animations: 'disabled' })
    await window.getByRole('button', { name: 'Sessions' }).click()
    await expect(window).toHaveScreenshot('language-sessions-en.png', { animations: 'disabled' })
    await window.getByRole('button', { name: 'Settings' }).click()
    await expect(window).toHaveScreenshot('language-settings-en.png', { animations: 'disabled' })
  })
})
