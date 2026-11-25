import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test'
import { codeForPeriod } from '../../web/src/student/classCode'

const apiPath = /\/api\/auth\/(login|me|refresh|logout)$/

type WebProfile = 'admin' | 'student'
type WebSession = { sub: string; email: string; profile: WebProfile }
type MockSessionState = { session: WebSession | null; logoutFails: boolean }

const mockSessions = new WeakMap<BrowserContext, MockSessionState>()

async function mockWebSession(context: BrowserContext): Promise<MockSessionState> {
  const state: MockSessionState = { session: null, logoutFails: false }
  mockSessions.set(context, state)
  await context.route(apiPath, async (route: Route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname.endsWith('/login')) {
      const credentials = route.request().postDataJSON() as { email?: string; password?: string }
      const email = credentials.email?.trim().toLowerCase()
      const profile =
        email === 'profesor@atempo.test'
          ? 'admin'
          : email === 'ada.lopez@clase.test'
            ? 'student'
            : null
      if (profile === null || credentials.password !== 'auth0-password') {
        await route.fulfill({ status: 401, json: { code: 'INVALID_CREDENTIALS' } })
        return
      }
      state.session = { sub: `auth0|${profile}-example`, email: email!, profile }
      await route.fulfill({
        status: 200,
        json: state.session,
        headers: {
          'set-cookie':
            'atempo_access=test-access; Path=/; HttpOnly; SameSite=Lax, atempo_refresh=test-refresh; Path=/; HttpOnly; SameSite=Lax, atempo_identity=test-identity; Path=/; HttpOnly; SameSite=Lax'
        }
      })
      return
    }
    if (pathname.endsWith('/me')) {
      const cookie = route.request().headers().cookie ?? ''
      const hasSessionCookie = /(?:^|;\s*)atempo_access=test-access(?:;|$)/.test(cookie)
      await route.fulfill({
        status: state.session === null || !hasSessionCookie ? 401 : 200,
        json: state.session === null || !hasSessionCookie ? {} : state.session
      })
      return
    }
    if (pathname.endsWith('/refresh')) {
      const cookie = route.request().headers().cookie ?? ''
      const hasRefresh = /(?:^|;\s*)atempo_refresh=test-refresh(?:;|$)/.test(cookie)
      await route.fulfill({
        status: state.session === null || !hasRefresh ? 401 : 200,
        json: {},
        headers: {
          'set-cookie':
            'atempo_access=test-access; Path=/; HttpOnly; SameSite=Lax, atempo_refresh=test-refresh; Path=/; HttpOnly; SameSite=Lax'
        }
      })
      return
    }
    if (state.logoutFails) {
      await route.abort('failed')
      return
    }
    state.session = null
    await route.fulfill({ status: 200, json: { success: true } })
  })
  return state
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.getByLabel('Correo', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('auth0-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test.beforeEach(async ({ context }) => {
  await mockWebSession(context)
})

test('Auth0 profiles enter their own web area and cannot open the other profile routes', async ({
  page
}) => {
  await page.goto('/')
  await signIn(page, 'ada.lopez@clase.test')
  await expect(page).toHaveURL(/\/student\/dashboard/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ada')
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/student\/dashboard/)
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()

  await page.goto('/admin')
  await signIn(page, 'profesor@atempo.test')
  await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ventura')
  await page.goto('/student/dashboard')
  await expect(page).toHaveURL(/\/admin/)
})

test('rejects an unknown account with a generic error and keeps password out of browser storage', async ({
  page
}) => {
  await page.goto('/')
  await signIn(page, 'unknown@example.test')
  await expect(page.getByRole('alert')).toContainText(/correo o la contraseña/i)
  await expect(page).toHaveURL(/\/$/)
  const storage = await page.evaluate(() => ({
    local: JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
    cookies: document.cookie
  }))
  expect(JSON.stringify(storage)).not.toContain('auth0-password')
  expect(JSON.stringify(storage)).not.toContain('accessToken')
  expect(JSON.stringify(storage)).not.toContain('refreshToken')
})

test('restores the server session after reload and logs out across protected routes', async ({
  page,
  context
}) => {
  await page.goto('/admin')
  await signIn(page, 'profesor@atempo.test')
  await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible()
  const browserState = await page.evaluate(() => ({
    local: JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
    cookies: document.cookie
  }))
  expect(JSON.stringify(browserState)).not.toMatch(/test-access|test-refresh|accessToken|refreshToken/)
  expect(JSON.stringify(browserState)).not.toContain('auth0-password')
  await page.reload()
  await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible()
  const secondTab = await context.newPage()
  await secondTab.goto('/admin')
  await expect(secondTab.getByRole('navigation', { name: 'Administración' })).toBeVisible()
  await secondTab.close()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Administración' })).toBeVisible()
  await page.goto('/admin/people')
  await expect(page.getByRole('heading', { level: 1, name: 'Administración' })).toBeVisible()
})

test('keeps a pending class QR check-in through Ada login', async ({ page }) => {
  const scannedAt = new Date('2026-11-25T10:00:00+01:00')
  await page.clock.install({ time: scannedAt })
  const period = Math.floor(scannedAt.getTime() / 30_000)
  const code = codeForPeriod('ATEMPO-CLASE-1109', period)

  await page.goto(`/student/check-in?code=ATEMPO-CLASE-1109-${code}`)
  await expect(page.getByText('Entra para registrar tu asistencia.')).toBeVisible()
  await signIn(page, 'ada.lopez@clase.test')
  await expect(page).toHaveURL(/\/student\/registered/)
  await expect(page.getByRole('heading', { level: 1, name: 'Disfruta la clase' })).toBeVisible()
  await expect(page.getByText('10:00', { exact: true })).toBeVisible()
})

test('keeps the authenticated area open when the router cannot complete logout', async ({
  page,
  context
}) => {
  const mockSession = mockSessions.get(context)!
  await page.goto('/admin')
  await signIn(page, 'profesor@atempo.test')
  await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible()
  mockSession.logoutFails = true
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('No se pudo cerrar la sesión')
  mockSession.logoutFails = false
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Administración' })).toBeVisible()

  await page.goto('/')
  await signIn(page, 'ada.lopez@clase.test')
  await expect(page).toHaveURL(/\/student\/dashboard/)
  mockSession.logoutFails = true
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ada')
  await expect(page.getByRole('alert')).toContainText('No se pudo cerrar la sesión')
  mockSession.logoutFails = false
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
})

test('blocks local organization signup and invitation activation', async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(/todavía no está disponible/i)
  await expect(page.getByLabel('CIF', { exact: true })).toHaveCount(0)
  await page.goto('/?invitation=731905')
  await expect(page.getByRole('status')).toContainText(/todavía no está disponible/i)
  await expect(page.getByLabel('Documento de identidad', { exact: true })).toHaveCount(0)
})
