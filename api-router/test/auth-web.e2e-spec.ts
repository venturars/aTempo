import { generateKeyPairSync, sign } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'

const auth0Config = {
  AUTH0_DOMAIN: 'tenant.example.test',
  AUTH0_CLIENT_ID: 'test-client-id',
  AUTH0_CLIENT_SECRET: 'test-client-secret',
  AUTH0_AUDIENCE: 'https://api.example.test',
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
})
const signingKey = {
  ...publicKey.export({ format: 'jwk' }),
  kid: 'test-key',
  use: 'sig',
  alg: 'RS256',
}

function createAccessToken(payload: unknown): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', kid: 'test-key' }),
  ).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  )
  const signedContent = `${header}.${encodedPayload}`
  return `${signedContent}.${sign('RSA-SHA256', Buffer.from(signedContent), privateKey).toString('base64url')}`
}

function auth0Response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('Web authentication cookies (e2e)', () => {
  let app: INestApplication<App>
  let fetchMock: jest.Mock
  let originalEnvironment: NodeJS.ProcessEnv

  beforeEach(async () => {
    originalEnvironment = { ...process.env }
    Object.assign(process.env, auth0Config)
    process.env.API_POSTGRESQL_URL = 'http://api-postgresql:3001'
    fetchMock = jest.spyOn(global, 'fetch') as unknown as jest.Mock
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/health')) {
        return auth0Response({ status: 'ok' })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    fetchMock.mockRestore()
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnvironment)) delete process.env[key]
    }
    Object.assign(process.env, originalEnvironment)
  })

  function mockJwks(): void {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/.well-known/jwks.json')) {
        return auth0Response({ keys: [signingKey] })
      }
      if (url.includes('/health')) {
        return auth0Response({ status: 'ok' })
      }
      if (url.endsWith('/oauth/revoke')) {
        return new Response(null, { status: 200 })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
  }

  function tokenClaims(
    subject: string,
    email: string,
  ): Record<string, unknown> {
    return {
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: subject,
      email,
    }
  }

  function mockSuccessfulLogin(
    subject = 'auth0|test-user',
    email = 'profesor@atempo.test',
  ): string {
    const accessToken = createAccessToken(tokenClaims(subject, email))
    mockJwks()
    fetchMock.mockResolvedValueOnce(
      auth0Response({
        access_token: accessToken,
        refresh_token: 'private-refresh-token',
        expires_in: 300,
      }),
    )
    return accessToken
  }

  it.each([
    ['profesor@atempo.test', 'admin'],
    ['ada.lopez@clase.test', 'student'],
  ] as const)(
    'POST /auth/login creates HttpOnly token cookies for %s with profile %s',
    async (email, profile) => {
      const accessToken = mockSuccessfulLogin('auth0|test-user', email)

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Origin', 'http://localhost:5191')
        .send({ email, password: 'test-password' })
        .expect(200)
        .expect({ email, profile })

      const setCookie = String(response.headers['set-cookie'])
      expect(setCookie).toMatch(/atempo_access=/)
      expect(setCookie).toMatch(/atempo_refresh=/)
      expect(setCookie).toMatch(/HttpOnly/i)
      expect(setCookie).toMatch(/SameSite=Lax/i)
      expect(setCookie).toMatch(/Path=\//i)
      expect(setCookie).not.toMatch(/Max-Age/i)
      expect(JSON.stringify(response.body)).not.toContain(accessToken)
      expect(JSON.stringify(response.body)).not.toContain(
        'private-refresh-token',
      )
      expect(JSON.stringify(response.body)).not.toContain('test-password')

      const [url, options] = fetchMock.mock.calls[0]
      expect(url).toBe('https://tenant.example.test/oauth/token')
      expect(JSON.parse(String(options?.body))).toMatchObject({
        grant_type: 'password',
        username: email,
        password: 'test-password',
        audience: auth0Config.AUTH0_AUDIENCE,
      })
    },
  )

  it('POST /auth/login rejects an unknown identity and revokes its refresh token', async () => {
    const accessToken = createAccessToken(
      tokenClaims('auth0|unknown-user', 'other@atempo.test'),
    )
    mockJwks()
    fetchMock.mockResolvedValueOnce(
      auth0Response({
        access_token: accessToken,
        refresh_token: 'unauthorized-refresh-token',
        expires_in: 300,
      }),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'other@atempo.test', password: 'test-password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_CREDENTIALS')
        expect(JSON.stringify(body)).not.toContain('unauthorized-refresh-token')
      })

    const [revokeUrl, revokeOptions] = fetchMock.mock.calls.at(-1) ?? []
    expect(revokeUrl).toBe('https://tenant.example.test/oauth/revoke')
    expect(JSON.parse(String(revokeOptions?.body))).toMatchObject({
      token: 'unauthorized-refresh-token',
    })
  })

  it('POST /auth/login maps Auth0 credential rejection to a generic 401', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { error: 'invalid_grant', error_description: 'private detail' },
        403,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_CREDENTIALS')
        expect(JSON.stringify(body)).not.toContain('private detail')
      })
  })

  it('POST /auth/login rejects a disallowed Origin before creating a session', async () => {
    process.env.ATEMPO_WEB_ORIGIN = 'https://web.example.test'

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'https://attacker.example.test')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(403)
      .expect(({ body }) => expect(body.code).toBe('WEB_ORIGIN_NOT_ALLOWED'))

    expect(response.headers['set-cookie']).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
    await request(app.getHttpServer()).get('/auth/me').expect(401)
  })

  it('GET /auth/me restores the web profile from HttpOnly cookies', async () => {
    mockSuccessfulLogin()
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)

    await agent.get('/auth/me').expect(200).expect({
      email: 'profesor@atempo.test',
      profile: 'admin',
    })
  })

  it('GET /auth/me rejects a missing or unknown access cookie', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401)

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'atempo_access=unknown-token')
      .expect(401)
  })

  it('POST /auth/refresh renews cookies without exposing tokens in JSON', async () => {
    const loginToken = mockSuccessfulLogin(
      'auth0|test-user',
      'ada.lopez@clase.test',
    )
    const renewedAccessToken = createAccessToken(
      tokenClaims('auth0|test-user', 'ada.lopez@clase.test'),
    )
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)

    fetchMock.mockResolvedValueOnce(
      auth0Response({
        access_token: renewedAccessToken,
        refresh_token: 'rotated-refresh-token',
        expires_in: 300,
      }),
    )

    const response = await agent
      .post('/auth/refresh')
      .set('Origin', 'http://localhost:5191')
      .send({})
      .expect(200)
    expect(JSON.stringify(response.body)).not.toContain(renewedAccessToken)
    expect(JSON.stringify(response.body)).not.toContain('private-refresh-token')
    expect(JSON.stringify(response.body)).not.toContain(loginToken)
    expect(String(response.headers['set-cookie'])).toMatch(/atempo_access=/)

    const refreshCall = fetchMock.mock.calls.find(([url, options]) => {
      if (!String(url).endsWith('/oauth/token')) return false
      return JSON.parse(String(options?.body)).grant_type === 'refresh_token'
    })
    expect(JSON.parse(String(refreshCall?.[1]?.body))).toMatchObject({
      grant_type: 'refresh_token',
      refresh_token: 'private-refresh-token',
    })

    mockJwks()
    await agent.get('/auth/me').expect(200).expect({
      email: 'ada.lopez@clase.test',
      profile: 'student',
    })
  })

  it('POST /auth/login replaces and revokes the refresh token of the previous cookies', async () => {
    const firstAccessToken = createAccessToken(
      tokenClaims('auth0|student-user', 'ada.lopez@clase.test'),
    )
    const secondAccessToken = createAccessToken(
      tokenClaims('auth0|teacher-user', 'profesor@atempo.test'),
    )
    const tokenResponses = [
      {
        access_token: firstAccessToken,
        refresh_token: 'previous-refresh-token',
        expires_in: 300,
      },
      {
        access_token: secondAccessToken,
        refresh_token: 'current-refresh-token',
        expires_in: 300,
      },
    ]
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/oauth/token')) {
        const tokenResponse = tokenResponses.shift()
        if (tokenResponse === undefined)
          throw new Error('Unexpected token request')
        return auth0Response(tokenResponse)
      }
      if (url.endsWith('/.well-known/jwks.json')) {
        return auth0Response({ keys: [signingKey] })
      }
      if (url.includes('/health')) {
        return auth0Response({ status: 'ok' })
      }
      if (url.endsWith('/oauth/revoke'))
        return new Response(null, { status: 200 })
      throw new Error(`Unexpected Auth0 request: ${url}`)
    })

    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)

    await agent
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)
      .expect({
        email: 'profesor@atempo.test',
        profile: 'admin',
      })

    const revokeCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/oauth/revoke'),
    )
    expect(JSON.parse(String(revokeCall?.[1]?.body))).toMatchObject({
      token: 'previous-refresh-token',
    })
  })

  it('POST /auth/logout rejects a disallowed Origin and keeps the current session', async () => {
    process.env.ATEMPO_WEB_ORIGIN = 'https://web.example.test'
    mockSuccessfulLogin('auth0|test-user', 'ada.lopez@clase.test')
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/login')
      .set('Origin', 'https://web.example.test')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)
    const callsBeforeLogout = fetchMock.mock.calls.length

    const response = await agent
      .post('/auth/logout')
      .set('Origin', 'https://attacker.example.test')
      .send({})
      .expect(403)
      .expect(({ body }) => expect(body.code).toBe('WEB_ORIGIN_NOT_ALLOWED'))

    expect(response.headers['set-cookie']).toBeUndefined()
    expect(fetchMock.mock.calls).toHaveLength(callsBeforeLogout)
    mockJwks()
    await agent.get('/auth/me').expect(200).expect({
      email: 'ada.lopez@clase.test',
      profile: 'student',
    })
  })

  it('POST /auth/logout clears the cookies and revokes the refresh token', async () => {
    mockSuccessfulLogin('auth0|test-user', 'ada.lopez@clase.test')
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)

    const logout = await agent
      .post('/auth/logout')
      .set('Origin', 'http://localhost:5191')
      .send({})
      .expect(200)
    const setCookie = String(logout.headers['set-cookie'])
    expect(setCookie).toMatch(/atempo_access=;/)
    expect(setCookie).toMatch(/HttpOnly/i)

    const [url, options] = fetchMock.mock.calls.at(-1) ?? []
    expect(url).toBe('https://tenant.example.test/oauth/revoke')
    expect(JSON.parse(String(options?.body))).toMatchObject({
      token: 'private-refresh-token',
    })
    await agent.get('/auth/me').expect(401)
  })

  it('POST /auth/logout clears the cookies when Auth0 revocation fails', async () => {
    mockSuccessfulLogin()
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)
    fetchMock.mockRejectedValueOnce(new Error('network unavailable'))

    await agent
      .post('/auth/logout')
      .set('Origin', 'http://localhost:5191')
      .send({})
      .expect(200)
    await agent.get('/auth/me').expect(401)
  })
})
