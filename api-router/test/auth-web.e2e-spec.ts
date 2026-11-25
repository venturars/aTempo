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

describe('Web authentication session (e2e)', () => {
  let app: INestApplication<App>
  let fetchMock: jest.Mock
  let originalEnvironment: NodeJS.ProcessEnv

  beforeEach(async () => {
    originalEnvironment = { ...process.env }
    Object.assign(process.env, auth0Config)
    fetchMock = jest.spyOn(global, 'fetch') as unknown as jest.Mock

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
    fetchMock.mockResolvedValue(auth0Response({ keys: [signingKey] }))
  }

  function mockSuccessfulLogin(subject = 'auth0|test-user'): string {
    const accessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: subject,
    })
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
    'POST /auth/web/login creates a cookie session for %s with profile %s',
    async (email, profile) => {
      const accessToken = mockSuccessfulLogin()

      const response = await request(app.getHttpServer())
        .post('/auth/web/login')
        .set('Origin', 'http://localhost:5191')
        .send({ email, password: 'test-password' })
        .expect(200)
        .expect({ sub: 'auth0|test-user', email, profile })

      const setCookie = String(response.headers['set-cookie'])
      expect(setCookie).toMatch(/HttpOnly/i)
      expect(setCookie).toMatch(/SameSite=Lax/i)
      expect(setCookie).toMatch(/Path=\//i)
      expect(setCookie).not.toMatch(/Max-Age/i)
      expect(setCookie).not.toContain(accessToken)
      expect(setCookie).not.toContain('private-refresh-token')
      expect(JSON.stringify(response.body)).not.toContain(accessToken)
      expect(JSON.stringify(response.body)).not.toContain('private-refresh-token')
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

  it('POST /auth/web/login rejects an unknown identity and revokes its refresh token', async () => {
    const accessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|unknown-user',
    })
    mockJwks()
    fetchMock.mockResolvedValueOnce(
      auth0Response({
        access_token: accessToken,
        refresh_token: 'unauthorized-refresh-token',
        expires_in: 300,
      }),
    )

    await request(app.getHttpServer())
      .post('/auth/web/login')
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

  it('POST /auth/web/login maps Auth0 credential rejection to a generic 401', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({ error: 'invalid_grant', error_description: 'private detail' }, 403),
    )

    await request(app.getHttpServer())
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_CREDENTIALS')
        expect(JSON.stringify(body)).not.toContain('private detail')
      })
  })

  it('POST /auth/web/login rejects a disallowed Origin before creating a session', async () => {
    process.env.ATEMPO_WEB_ORIGIN = 'https://web.example.test'

    const response = await request(app.getHttpServer())
      .post('/auth/web/login')
      .set('Origin', 'https://attacker.example.test')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(403)
      .expect(({ body }) => expect(body.code).toBe('WEB_ORIGIN_NOT_ALLOWED'))

    expect(response.headers['set-cookie']).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
    await request(app.getHttpServer()).get('/auth/web/session').expect(401)
  })

  it('GET /auth/web/session restores the session from its HttpOnly cookie', async () => {
    mockSuccessfulLogin()
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)

    await agent
      .get('/auth/web/session')
      .expect(200)
      .expect({
        sub: 'auth0|test-user',
        email: 'profesor@atempo.test',
        profile: 'admin',
      })
  })

  it('GET /auth/web/session rejects a missing or unknown session cookie', async () => {
    await request(app.getHttpServer())
      .get('/auth/web/session')
      .expect(401)

    await request(app.getHttpServer())
      .get('/auth/web/session')
      .set('Cookie', 'atempo_session=unknown-session-id')
      .expect(401)
  })

  it('GET /auth/web/session refreshes an expired access token without exposing new tokens', async () => {
    const expiredToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
    })
    const renewedAccessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
    })
    mockJwks()
    fetchMock
      .mockResolvedValueOnce(
        auth0Response({
          access_token: expiredToken,
          refresh_token: 'private-refresh-token',
          expires_in: 0,
        }),
      )
      .mockResolvedValueOnce(auth0Response({ keys: [signingKey] }))
      .mockResolvedValueOnce(
        auth0Response({ access_token: renewedAccessToken, expires_in: 300 }),
      )

    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)

    const response = await agent.get('/auth/web/session').expect(200)
    expect(response.body).toEqual({
      sub: 'auth0|test-user',
      email: 'ada.lopez@clase.test',
      profile: 'student',
    })
    expect(JSON.stringify(response.body)).not.toContain(renewedAccessToken)
    expect(JSON.stringify(response.body)).not.toContain('private-refresh-token')
  })

  it('GET /auth/web/session refreshes when Auth0 rejects the token before its reported expiry', async () => {
    const loginTime = Date.now()
    const accessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor((loginTime + 60_000) / 1000),
      sub: 'auth0|test-user',
    })
    const renewedAccessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor((loginTime + 600_000) / 1000),
      sub: 'auth0|test-user',
    })
    mockJwks()
    fetchMock
      .mockResolvedValueOnce(
        auth0Response({
          access_token: accessToken,
          refresh_token: 'private-refresh-token',
          expires_in: 600,
        }),
      )
      .mockResolvedValueOnce(auth0Response({ keys: [signingKey] }))
      .mockResolvedValueOnce(
        auth0Response({ access_token: renewedAccessToken, expires_in: 600 }),
      )

    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)

    const mockNow = jest.spyOn(Date, 'now').mockReturnValue(loginTime + 120_000)
    let response: request.Response
    try {
      response = await agent.get('/auth/web/session').expect(200)
    } finally {
      mockNow.mockRestore()
    }

    expect(response!.body).toEqual({
      sub: 'auth0|test-user',
      email: 'ada.lopez@clase.test',
      profile: 'student',
    })
    const refreshCall = fetchMock.mock.calls.find(([url, options]) => {
      if (!String(url).endsWith('/oauth/token')) return false
      return (
        JSON.parse(String(options?.body)).grant_type === 'refresh_token'
      )
    })
    expect(JSON.parse(String(refreshCall?.[1]?.body))).toMatchObject({
      grant_type: 'refresh_token',
      refresh_token: 'private-refresh-token',
    })
    expect(JSON.stringify(response!.body)).not.toContain(renewedAccessToken)
  })

  it('POST /auth/web/login replaces and revokes the session identified by the existing cookie', async () => {
    const firstAccessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|student-user',
    })
    const secondAccessToken = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|teacher-user',
    })
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
        if (tokenResponse === undefined) throw new Error('Unexpected token request')
        return auth0Response(tokenResponse)
      }
      if (url.endsWith('/.well-known/jwks.json')) {
        return auth0Response({ keys: [signingKey] })
      }
      if (url.endsWith('/oauth/revoke')) return new Response(null, { status: 200 })
      throw new Error(`Unexpected Auth0 request: ${url}`)
    })

    const agent = request.agent(app.getHttpServer())
    const firstLogin = await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)
    const previousCookie = String(firstLogin.headers['set-cookie'])
      .match(/atempo_session=([^;,]+)/)?.[1]
    expect(previousCookie).toBeDefined()

    await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)
      .expect({
        sub: 'auth0|teacher-user',
        email: 'profesor@atempo.test',
        profile: 'admin',
      })

    const revokeCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/oauth/revoke'),
    )
    expect(JSON.parse(String(revokeCall?.[1]?.body))).toMatchObject({
      token: 'previous-refresh-token',
    })
    await request(app.getHttpServer())
      .get('/auth/web/session')
      .set('Cookie', `atempo_session=${previousCookie}`)
      .expect(401)
  })

  it('POST /auth/web/logout rejects a disallowed Origin and keeps the current session', async () => {
    process.env.ATEMPO_WEB_ORIGIN = 'https://web.example.test'
    mockSuccessfulLogin()
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/web/login')
      .set('Origin', 'https://web.example.test')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)
    const callsBeforeLogout = fetchMock.mock.calls.length

    const response = await agent
      .post('/auth/web/logout')
      .set('Origin', 'https://attacker.example.test')
      .expect(403)
      .expect(({ body }) => expect(body.code).toBe('WEB_ORIGIN_NOT_ALLOWED'))

    expect(response.headers['set-cookie']).toBeUndefined()
    expect(fetchMock.mock.calls).toHaveLength(callsBeforeLogout)
    await agent
      .get('/auth/web/session')
      .expect(200)
      .expect({
        sub: 'auth0|test-user',
        email: 'ada.lopez@clase.test',
        profile: 'student',
      })
  })

  it('POST /auth/web/logout clears the cookie and revokes the refresh token', async () => {
    mockSuccessfulLogin()
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'ada.lopez@clase.test', password: 'test-password' })
      .expect(200)

    const logout = await agent
      .post('/auth/web/logout')
      .set('Origin', 'http://localhost:5191')
      .expect(204)
    const setCookie = String(logout.headers['set-cookie'])
    expect(setCookie).toMatch(/atempo_session=;/)
    expect(setCookie).toMatch(/HttpOnly/i)

    const [url, options] = fetchMock.mock.calls.at(-1) ?? []
    expect(url).toBe('https://tenant.example.test/oauth/revoke')
    expect(JSON.parse(String(options?.body))).toMatchObject({
      token: 'private-refresh-token',
    })
    await agent.get('/auth/web/session').expect(401)
  })

  it('POST /auth/web/logout clears the session when Auth0 revocation fails', async () => {
    mockSuccessfulLogin()
    const agent = request.agent(app.getHttpServer())
    await agent
      .post('/auth/web/login')
      .set('Origin', 'http://localhost:5191')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)
    fetchMock.mockRejectedValueOnce(new Error('network unavailable'))

    await agent
      .post('/auth/web/logout')
      .set('Origin', 'http://localhost:5191')
      .expect(204)
    await agent.get('/auth/web/session').expect(401)
  })
})
