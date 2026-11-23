import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'

type MockAuthServer = {
  url: string
  close: () => Promise<void>
  setMeUnauthorized: (unauthorized: boolean) => void
  requests: Array<{ method: string; path: string; authorization?: string; body?: unknown }>
}

const accessToken = 'mock-access-token-that-must-not-reach-the-renderer'

type AuthBridge = {
  auth: {
    isConfigured: () => Promise<boolean>
    login: (credentials: { email: string; password: string }) => Promise<{
      sub: string
      email: string
    }>
    me: () => Promise<{ sub: string; email: string } | null>
    logout: () => Promise<void>
  }
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  let body = ''
  for await (const chunk of request) body += chunk.toString()
  return body === '' ? undefined : JSON.parse(body)
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function createMockAuthServer(): Promise<MockAuthServer> {
  const requests: MockAuthServer['requests'] = []
  let unauthorized = false
  const server: Server = createServer(async (request, response) => {
    const body = await readBody(request)
    requests.push({
      method: request.method ?? '',
      path: request.url ?? '',
      authorization: request.headers.authorization,
      body
    })

    if (request.method === 'POST' && request.url === '/auth/login') {
      if ((body as { password?: string } | undefined)?.password === 'invalid') {
        sendJson(response, 401, { code: 'INVALID_CREDENTIALS' })
        return
      }
      sendJson(response, 200, { accessToken, expiresIn: 3600 })
      return
    }

    if (request.method === 'GET' && request.url === '/auth/me') {
      if (unauthorized || request.headers.authorization !== `Bearer ${accessToken}`) {
        sendJson(response, 401, { code: 'UNAUTHORIZED' })
        return
      }
      sendJson(response, 200, { sub: 'auth0|sample-user' })
      return
    }

    sendJson(response, 404, { code: 'NOT_FOUND' })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Mock server did not bind')

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    setMeUnauthorized: (value) => {
      unauthorized = value
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
  }
}

async function withRouter<T>(run: (router: MockAuthServer) => Promise<T>): Promise<T> {
  const router = await createMockAuthServer()
  const originalUrl = process.env.ATEMPO_API_ROUTER_URL
  process.env.ATEMPO_API_ROUTER_URL = router.url
  try {
    return await run(router)
  } finally {
    if (originalUrl === undefined) delete process.env.ATEMPO_API_ROUTER_URL
    else process.env.ATEMPO_API_ROUTER_URL = originalUrl
    await router.close()
  }
}

async function withElectron<T>(
  run: (app: ElectronApplication, page: Page) => Promise<T>,
  flags: string[] = []
): Promise<T> {
  const app = await launchHiddenElectron(flags)
  try {
    const page = await app.firstWindow()
    return await run(app, page)
  } finally {
    await app.close()
  }
}

test.describe('Auth0 desktop session bridge', () => {
  test.skip(
    process.platform !== 'darwin',
    'The hidden Electron harness is available on macOS only.'
  )

  test('authenticates the demo teacher, sends a Bearer token, and keeps the token out of the renderer', async () => {
    await withRouter(async (router) =>
      withElectron(async (_app, page) => {
        await page.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
        await page.getByLabel('Contraseña', { exact: true }).fill('auth0-test-password')
        await page.getByRole('button', { name: 'Entrar', exact: true }).click()

        await expect(page).toHaveURL(/#\/teacher\/panel$/)
        await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
        expect(router.requests.map(({ path }) => path)).toEqual(['/auth/login', '/auth/me'])
        expect(router.requests[0]).toMatchObject({
          method: 'POST',
          body: { email: 'profesor@atempo.test', password: 'auth0-test-password' }
        })
        expect(router.requests[1]?.authorization).toBe(`Bearer ${accessToken}`)

        const bridge = await page.evaluate(async () => {
          const user = await (window as unknown as { api: AuthBridge }).api.auth.me()
          return { user, methods: Object.keys((window as unknown as { api: AuthBridge }).api.auth) }
        })
        expect(bridge.user).toEqual({ sub: 'auth0|sample-user', email: 'profesor@atempo.test' })
        expect(bridge.methods).toEqual(['isConfigured', 'login', 'me', 'logout'])
        expect(JSON.stringify(bridge)).not.toContain(accessToken)
      })
    )
  })

  test('routes the Auth0 demo student to the student dashboard', async () => {
    await withRouter(async (router) =>
      withElectron(async (_app, page) => {
        await page.getByLabel('Correo', { exact: true }).fill('ada.lopez@clase.test')
        await page.getByLabel('Contraseña', { exact: true }).fill('auth0-test-password')
        await page.getByRole('button', { name: 'Entrar', exact: true }).click()

        await expect(page).toHaveURL(/#\/student\/dashboard$/)
        expect(router.requests.map(({ path }) => path)).toEqual(['/auth/login', '/auth/me'])
        expect(router.requests[1]?.authorization).toBe(`Bearer ${accessToken}`)
      })
    )
  })

  test('rejects invalid credentials without creating an authenticated session', async () => {
    await withRouter(async (router) =>
      withElectron(async (_app, page) => {
        await page.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
        await page.getByLabel('Contraseña', { exact: true }).fill('invalid')
        await page.getByRole('button', { name: 'Entrar', exact: true }).click()
        const alert = page.getByRole('alert')
        await expect(alert).toBeVisible()
        await expect(alert).not.toContainText('cuenta de ejemplo')
        await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toHaveCount(0)
        expect(router.requests.map(({ path }) => path)).toEqual(['/auth/login'])
      })
    )
  })

  test('does not create a local account when the router is configured', async () => {
    await withRouter(async (router) =>
      withElectron(
        async (_app, page) => {
          // #130 removed the sign-up screen and its flag: the app opens the login.
          await expect(page.getByLabel('Correo', { exact: true })).toBeVisible()
          await expect(page.getByLabel('Nombre completo')).toHaveCount(0)
          await expect(page.getByRole('button', { name: 'Crear mi cuenta' })).toHaveCount(0)
          expect(router.requests).toEqual([])
        },
        ['--sign-up']
      )
    )
  })

  test('clears the token on logout and when /auth/me returns 401', async () => {
    await withRouter(async (router) =>
      withElectron(async (_app, page) => {
        const login = await page.evaluate(() =>
          (window as unknown as { api: AuthBridge }).api.auth.login({
            email: 'ada.lopez@clase.test',
            password: 'auth0-test-password'
          })
        )
        expect(login).toEqual({ sub: 'auth0|sample-user', email: 'ada.lopez@clase.test' })

        router.setMeUnauthorized(true)
        await expect(
          page.evaluate(() => (window as unknown as { api: AuthBridge }).api.auth.me())
        ).resolves.toBeNull()
        const requestsAfterUnauthorized = router.requests.length
        await expect(
          page.evaluate(() => (window as unknown as { api: AuthBridge }).api.auth.me())
        ).resolves.toBeNull()
        expect(router.requests).toHaveLength(requestsAfterUnauthorized)

        await page.evaluate(() => (window as unknown as { api: AuthBridge }).api.auth.logout())
        await expect(
          page.evaluate(() => (window as unknown as { api: AuthBridge }).api.auth.me())
        ).resolves.toBeNull()
      })
    )
  })

  test('closes the visible session and returns to login', async () => {
    await withRouter(async (router) =>
      withElectron(async (_app, page) => {
        await page.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
        await page.getByLabel('Contraseña', { exact: true }).fill('auth0-test-password')
        await page.getByRole('button', { name: 'Entrar', exact: true }).click()
        await expect(page).toHaveURL(/#\/teacher\/panel$/)

        await page.locator('aside details.dropdown > summary').click()
        await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()

        await expect(page).toHaveURL(/#\/$/)
        await expect(page.getByLabel('Correo', { exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toHaveCount(
          0
        )
        const requestCount = router.requests.length
        await expect(
          page.evaluate(() => (window as unknown as { api: AuthBridge }).api.auth.me())
        ).resolves.toBeNull()
        expect(router.requests).toHaveLength(requestCount)
      })
    )
  })

  test('starts without an authenticated session after restarting Electron', async () => {
    await withRouter(async () => {
      await withElectron(async (_app, page) => {
        await page.evaluate(() =>
          (window as unknown as { api: AuthBridge }).api.auth.login({
            email: 'profesor@atempo.test',
            password: 'auth0-test-password'
          })
        )
      })

      await withElectron(async (_app, page) => {
        await expect(
          page.evaluate(() => (window as unknown as { api: AuthBridge }).api.auth.me())
        ).resolves.toBeNull()
      })
    })
  })
})
