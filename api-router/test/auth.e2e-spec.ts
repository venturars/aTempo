import { generateKeyPairSync, sign } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppError, err, type Sdk } from 'atempo-sdk'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { ATEMPO_SDK } from '../src/auth/atempo-sdk.token'
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

function createAccessToken(payload: unknown, key = privateKey): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', kid: 'test-key' }),
  ).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  )
  const signedContent = `${header}.${encodedPayload}`
  return `${signedContent}.${sign('RSA-SHA256', Buffer.from(signedContent), key).toString('base64url')}`
}

function auth0Response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function postgresHealthUrls(fetchMock: jest.Mock): string[] {
  return fetchMock.mock.calls
    .map(([input]) => String(input))
    .filter((url) => url.includes('/health'))
}

function spyAfterAuth(app: INestApplication<App>): jest.SpyInstance {
  return jest.spyOn(app.get<Sdk>(ATEMPO_SDK), 'afterAuth')
}

describe('Authentication (e2e)', () => {
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

  it('POST /auth/login exchanges credentials and returns the Access Token', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({ access_token: 'issued-token', expires_in: 3600 }),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)
      .expect({ accessToken: 'issued-token', expiresIn: 3600 })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://tenant.example.test/oauth/token')
    expect(JSON.parse(String(options?.body))).toMatchObject({
      grant_type: 'password',
      username: 'profesor@atempo.test',
      password: 'test-password',
      audience: auth0Config.AUTH0_AUDIENCE,
      client_secret: auth0Config.AUTH0_CLIENT_SECRET,
      scope: 'openid profile email offline_access',
    })
  })

  it('login calls afterAuth health when Auth0 succeeds', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({ access_token: 'issued-token', expires_in: 3600 }),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(200)
      .expect({ accessToken: 'issued-token', expiresIn: 3600 })

    expect(postgresHealthUrls(fetchMock)).toEqual([
      'http://api-postgresql:3001/health',
    ])
  })

  it('POST /auth/login maps rejected credentials to 401 without exposing the provider body', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { error: 'invalid_grant', error_description: 'private detail' },
        403,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unknown@atempo.test', password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'INVALID_CREDENTIALS' })
        expect(JSON.stringify(body)).not.toContain('private detail')
      })
  })

  it('login 401 does not call postgres health', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { error: 'invalid_grant', error_description: 'private detail' },
        403,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unknown@atempo.test', password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'INVALID_CREDENTIALS' })
      })

    expect(postgresHealthUrls(fetchMock)).toEqual([])
  })

  it('login returns 503 POSTGRES_API_UNAVAILABLE', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/oauth/token')) {
        return auth0Response({ access_token: 'issued-token', expires_in: 3600 })
      }
      if (url.includes('/health')) {
        return auth0Response({ status: 'error' }, 503)
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(503)
      .expect(({ body }) => expect(body.code).toBe('POSTGRES_API_UNAVAILABLE'))
  })

  it('POST /auth/login treats invalid Auth0 client credentials as a provider failure', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({ error: 'invalid_client' }, 401),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(503)
      .expect(({ body }) => expect(body.code).toBe('AUTH_PROVIDER_UNAVAILABLE'))
  })

  it('POST /auth/login rejects a provider failure without leaking its response', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { error: 'server_error', error_description: 'private detail' },
        500,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(503)
      .expect(({ body }) => {
        expect(body.code).toBe('AUTH_PROVIDER_UNAVAILABLE')
        expect(JSON.stringify(body)).not.toContain('private detail')
      })
  })

  it('POST /auth/login returns 503 when Auth0 is not configured', async () => {
    delete process.env.AUTH0_CLIENT_SECRET

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(503)
      .expect(({ body }) =>
        expect(body.code).toBe('AUTH_PROVIDER_NOT_CONFIGURED'),
      )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST /auth/login returns 503 when Auth0 cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network unavailable'))

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(503)
      .expect(({ body }) => expect(body.code).toBe('AUTH_PROVIDER_UNAVAILABLE'))
  })

  it('POST /auth/login returns 503 when the Auth0 request times out', async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException('request timed out', 'TimeoutError'),
    )

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profesor@atempo.test', password: 'test-password' })
      .expect(503)
      .expect(({ body }) => expect(body.code).toBe('AUTH_PROVIDER_UNAVAILABLE'))
  })

  it('GET /auth/me validates a signed Access Token and returns normalized email', async () => {
    mockJwks()
    const token = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
      email: '  Profesor@ATEMPO.TEST ',
    })

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ email: 'profesor@atempo.test' })
      .expect(({ body }) => {
        expect(body).not.toHaveProperty('sub')
        expect(Object.keys(body as object).sort()).toEqual(['email'])
      })
  })

  it('me calls afterAuth and keeps current body', async () => {
    mockJwks()
    const afterAuth = spyAfterAuth(app)
    const token = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
      email: '  Profesor@ATEMPO.TEST ',
    })

    try {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect({ email: 'profesor@atempo.test' })

      expect(afterAuth).toHaveBeenCalledWith({
        email: '  Profesor@ATEMPO.TEST ',
      })
    } finally {
      afterAuth.mockRestore()
    }
  })

  it('GET /auth/me rejects a signed token without an email claim', async () => {
    mockJwks()
    const token = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
    })

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .expect(({ body }) => expect(body.code).toBe('INVALID_TOKEN'))
  })

  it('afterAuth VALIDATION is 400 not POSTGRES_API_UNAVAILABLE', async () => {
    mockJwks()
    const afterAuth = spyAfterAuth(app)
    afterAuth.mockResolvedValue(
      err(new AppError('VALIDATION', 'El correo es obligatorio.')),
    )
    const token = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
      email: 'profesor@atempo.test',
    })

    try {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .expect(({ body }) => {
          expect(body.code).toBe('VALIDATION')
          expect(body.code).not.toBe('POSTGRES_API_UNAVAILABLE')
        })
    } finally {
      afterAuth.mockRestore()
    }
  })

  it('me without email does not call sdk', async () => {
    mockJwks()
    const afterAuth = spyAfterAuth(app)
    const token = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
    })

    try {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401)
        .expect(({ body }) => expect(body.code).toBe('INVALID_TOKEN'))

      expect(afterAuth).not.toHaveBeenCalled()
    } finally {
      afterAuth.mockRestore()
    }
  })

  it('GET /auth/me rejects a missing Bearer token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect(({ body }) => expect(body.code).toBe('INVALID_TOKEN'))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('GET /auth/me rejects a signed token whose payload is not an object', async () => {
    const token = createAccessToken(null)

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .expect(({ body }) => expect(body.code).toBe('INVALID_TOKEN'))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['expired', { exp: Math.floor(Date.now() / 1000) - 10 }],
    ['wrong issuer', { iss: 'https://attacker.example.test/' }],
    ['wrong audience', { aud: 'https://other-api.example.test' }],
  ])('GET /auth/me rejects a token with %s claims', async (_name, claims) => {
    mockJwks()
    const token = createAccessToken({
      iss: 'https://tenant.example.test/',
      aud: auth0Config.AUTH0_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'auth0|test-user',
      email: 'profesor@atempo.test',
      ...claims,
    })

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
  })

  it('GET /auth/me rejects a token with an invalid signature', async () => {
    mockJwks()
    const { privateKey: otherPrivateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    })
    const token = createAccessToken(
      {
        iss: 'https://tenant.example.test/',
        aud: auth0Config.AUTH0_AUDIENCE,
        exp: Math.floor(Date.now() / 1000) + 300,
        sub: 'auth0|test-user',
        email: 'profesor@atempo.test',
      },
      otherPrivateKey,
    )

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
  })

  it('POST /auth/register creates the user, logs in, and returns tokens', async () => {
    fetchMock
      .mockResolvedValueOnce(auth0Response({ _id: '507f1f77bcf86cd799439011' }))
      .mockResolvedValueOnce(
        auth0Response({
          access_token: 'issued-token',
          refresh_token: 'issued-refresh',
          expires_in: 3600,
        }),
      )

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'nuevo@atempo.test', password: 'SecurePass123!' })
      .expect(201)
      .expect({
        userId: 'auth0|507f1f77bcf86cd799439011',
        token: 'issued-token',
        refreshToken: 'issued-refresh',
      })

    const [signupUrl, signupOptions] = fetchMock.mock.calls[0]
    expect(signupUrl).toBe('https://tenant.example.test/dbconnections/signup')
    expect(JSON.parse(String(signupOptions?.body))).toMatchObject({
      email: 'nuevo@atempo.test',
      connection: 'Username-Password-Authentication',
    })
  })

  it('POST /auth/register maps a duplicate Auth0 user to 409', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { code: 'user_exists', description: 'private detail' },
        400,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'profesor@atempo.test', password: 'SecurePass123!' })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'USER_EXISTS' })
        expect(JSON.stringify(body)).not.toContain('private detail')
      })
  })

  it('POST /auth/register maps a rejected password to 400', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { code: 'invalid_password', name: 'PasswordStrengthError' },
        400,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'nuevo@atempo.test', password: 'weakpass' })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('INVALID_SIGNUP'))
  })

  it('POST /auth/refresh exchanges a refresh token for a new Access Token', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({
        access_token: 'new-access',
        refresh_token: 'rotated-refresh',
      }),
    )

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'issued-refresh' })
      .expect(200)
      .expect({ token: 'new-access', refreshToken: 'rotated-refresh' })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://tenant.example.test/oauth/token')
    expect(JSON.parse(String(options?.body))).toMatchObject({
      grant_type: 'refresh_token',
      refresh_token: 'issued-refresh',
    })
  })

  it('POST /auth/refresh keeps the original refresh token when Auth0 does not rotate it', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({ access_token: 'new-access' }),
    )

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'issued-refresh' })
      .expect(200)
      .expect({ token: 'new-access', refreshToken: 'issued-refresh' })
  })

  it('POST /auth/refresh maps invalid_grant to 401', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response(
        { error: 'invalid_grant', error_description: 'private detail' },
        403,
      ),
    )

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'expired-refresh' })
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'INVALID_REFRESH_TOKEN' })
        expect(JSON.stringify(body)).not.toContain('private detail')
      })
  })

  it('POST /auth/logout revokes the refresh token', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'issued-refresh' })
      .expect(200)
      .expect({ success: true })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://tenant.example.test/oauth/revoke')
    expect(JSON.parse(String(options?.body))).toMatchObject({
      token: 'issued-refresh',
      client_id: auth0Config.AUTH0_CLIENT_ID,
    })
  })

  it('POST /auth/logout maps a rejected refresh token to 401', async () => {
    fetchMock.mockResolvedValueOnce(
      auth0Response({ error: 'invalid_grant' }, 400),
    )

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'bad-refresh' })
      .expect(401)
      .expect(({ body }) => expect(body.code).toBe('INVALID_REFRESH_TOKEN'))
  })

  it('keeps GET /health and /docs public', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' })
    await request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('content-type', /html/)
  })
})
