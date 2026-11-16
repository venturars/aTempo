import { expect, test, type Page } from '@playwright/test'
import { useLoginStore } from '../src/renderer/src/login/loginStore'
import { useSessionStore } from '../src/renderer/src/session/sessionStore'
import { launchHiddenElectron } from './helpers/electron'

// Public fixture specified in #48, deliberately independent of the implementation constant.
const demoEmail = 'profesor@atempo.test'
const demoPassword = 'Profesor123!'
const loginError = 'El correo o la contraseña no coinciden con la cuenta de ejemplo.'

async function enter(window: Page, email: string, password: string): Promise<void> {
  await window.getByLabel('Correo', { exact: true }).fill(email)
  await window.getByLabel('Contraseña', { exact: true }).fill(password)
  await window.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function expectHoy(window: Page): Promise<void> {
  await expect(window).toHaveURL(/#\/teacher\/panel$/)
  await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
  await expect(window.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toHaveCount(0)
  await expect(window.getByRole('alert')).toHaveCount(0)
}

test.describe('teacher demo session logic', () => {
  test.beforeEach(() => {
    useLoginStore.setState(useLoginStore.getInitialState(), true)
    useSessionStore.setState(useSessionStore.getInitialState(), true)
  })

  test('starts with no profile or email', () => {
    expect(useSessionStore.getInitialState()).toEqual({ profile: null, email: null })
  })

  test('normalizes the public email and sets the teacher identity', () => {
    useLoginStore.getState().setEmail('  PROFESOR@ATEMPO.TEST  ')
    useLoginStore.getState().setPassword(demoPassword)
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toEqual({ profile: 'teacher', email: demoEmail })
    expect(useLoginStore.getState().loginError).toBe('')
  })

  for (const [name, email, password] of [
    ['wrong password', demoEmail, 'profesor123!'],
    ['unknown email', 'otra@atempo.test', demoPassword]
  ]) {
    test(`rejects ${name} without creating an identity and accepts a later correct submit`, () => {
      useLoginStore.getState().setEmail(email)
      useLoginStore.getState().setPassword(password)
      expect(useLoginStore.getState().submit()).toBe(false)
      expect(useSessionStore.getState()).toEqual({ profile: null, email: null })
      expect(useLoginStore.getState().loginError).toBe(loginError)
      useLoginStore.getState().setEmail(demoEmail)
      useLoginStore.getState().setPassword(demoPassword)
      expect(useLoginStore.getState().submit()).toBe(true)
      expect(useSessionStore.getState()).toEqual({ profile: 'teacher', email: demoEmail })
    })
  }
})

test('recovers from a wrong password with one correct submit in the same window', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    expect(new URL(window.url()).hash).toBe('')
    await enter(window, demoEmail, 'WrongPassword48!')
    await expect(window.getByRole('alert')).toHaveText(loginError)
    await expect(window.getByRole('status')).toHaveCount(0)
    expect(new URL(window.url()).hash).toBe('')
    const text = await window.locator('body').innerText()
    expect(text).not.toContain('WrongPassword48!')
    expect(text).not.toContain(demoEmail)
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toHaveCount(0)
    await window.getByLabel('Contraseña', { exact: true }).fill(demoPassword)
    await expect(window.getByRole('alert')).toHaveCount(0)
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('can log in again after renderer reload without persisting a session', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
    await window.reload()
    // The router preserves its hash; the in-memory session does not promise a route guard.
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await window.evaluate(() => {
      globalThis.location.hash = '#/'
    })
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
    await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('opens Hoy from a second fresh normal process after closing the first', async () => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const app = await launchHiddenElectron()
    try {
      const window = await app.firstWindow()
      expect(new URL(window.url()).hash).toBe('')
      await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
      await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
      await expect(window.getByRole('alert')).toHaveCount(0)
      await enter(window, demoEmail, demoPassword)
      await expectHoy(window)
      await window.screenshot({ path: test.info().outputPath(`teacher-demo-start-${attempt}.png`) })
    } finally {
      await app.close()
    }
  }
})
