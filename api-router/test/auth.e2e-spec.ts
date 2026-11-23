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

describe('Authentication (e2e)', () => {
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
    })
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

  it('GET /auth/me validates a signed Access Token and returns its subject', async () => {
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
      .expect(200)
      .expect({ sub: 'auth0|test-user' })
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
      },
      otherPrivateKey,
    )

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
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
