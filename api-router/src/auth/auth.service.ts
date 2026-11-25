import {
  createPublicKey,
  verify,
  type JsonWebKey as CryptoJsonWebKey,
} from 'node:crypto'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { LoginResponseDto } from './login-response.dto'
import { LogoutResponseDto } from './logout-response.dto'
import { MeResponseDto } from './me-response.dto'
import { RefreshResponseDto } from './refresh-response.dto'
import { RegisterResponseDto } from './register-response.dto'

type JwtHeader = { alg: 'RS256'; kid: string }
type JwtPayload = {
  aud: string | string[]
  email: string
  exp: number
  iss: string
  nbf?: number
  sub: string
}
type Auth0RsaKey = CryptoJsonWebKey & {
  kid: string
  kty: 'RSA'
  n: string
  e: string
}

// Los datos externos se validan antes de usarlos como claims o claves RSA.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJwtHeader(value: unknown): value is JwtHeader {
  return (
    isRecord(value) && value.alg === 'RS256' && typeof value.kid === 'string'
  )
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (!isRecord(value)) return false

  const audienceIsValid =
    typeof value.aud === 'string' ||
    (Array.isArray(value.aud) &&
      value.aud.every((audience: unknown) => typeof audience === 'string'))

  return (
    audienceIsValid &&
    typeof value.exp === 'number' &&
    typeof value.iss === 'string' &&
    (value.nbf === undefined || typeof value.nbf === 'number') &&
    typeof value.sub === 'string' &&
    value.sub.length > 0 &&
    typeof value.email === 'string' &&
    value.email.trim() !== ''
  )
}

function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isAuth0RsaKey(value: unknown): value is Auth0RsaKey {
  return (
    isRecord(value) &&
    value.kty === 'RSA' &&
    typeof value.kid === 'string' &&
    typeof value.n === 'string' &&
    typeof value.e === 'string'
  )
}

const auth0RequestTimeoutMs = 10_000
const jwksCacheDurationMs = 5 * 60_000

@Injectable()
export class AuthService {
  private cachedKeys: Auth0RsaKey[] = []
  private cachedKeysUntil = 0

  async register(
    email: string,
    password: string,
  ): Promise<RegisterResponseDto> {
    const config = this.getAuth0Config()
    const signupResponse = await fetch(`${config.issuer}dbconnections/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        email,
        password,
        connection: 'Username-Password-Authentication',
      }),
      signal: AbortSignal.timeout(auth0RequestTimeoutMs),
    }).catch(() => {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    })

    const signupResult: unknown = await signupResponse.json().catch(() => null)
    if (
      !signupResponse.ok &&
      isRecord(signupResult) &&
      signupResult.code === 'user_exists'
    ) {
      throw new ConflictException({ code: 'USER_EXISTS' })
    }
    if (
      !signupResponse.ok &&
      isRecord(signupResult) &&
      (signupResult.code === 'invalid_password' ||
        signupResult.code === 'invalid_signup' ||
        signupResult.name === 'PasswordStrengthError')
    ) {
      throw new BadRequestException({ code: 'INVALID_SIGNUP' })
    }
    if (!signupResponse.ok) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    }
    if (
      !isRecord(signupResult) ||
      typeof signupResult._id !== 'string' ||
      signupResult._id.length === 0
    ) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_INVALID_RESPONSE',
      })
    }

    const loginResult = await this.login(email, password)
    if (
      typeof loginResult.refreshToken !== 'string' ||
      loginResult.refreshToken.length === 0
    ) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_INVALID_RESPONSE',
      })
    }

    const rawId = signupResult._id
    return {
      userId: rawId.startsWith('auth0|') ? rawId : `auth0|${rawId}`,
      token: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
    }
  }

  async logout(refreshToken: string): Promise<LogoutResponseDto> {
    const config = this.getAuth0Config()
    const response = await fetch(`${config.issuer}oauth/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        token: refreshToken,
      }),
      signal: AbortSignal.timeout(auth0RequestTimeoutMs),
    }).catch(() => {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    })

    const result: unknown = await response.json().catch(() => null)
    if (
      isRecord(result) &&
      (result.error === 'invalid_grant' || result.error === 'invalid_request')
    ) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' })
    }
    if (!response.ok && (response.status === 400 || response.status === 401)) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' })
    }
    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    }

    return { success: true }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponseDto> {
    const config = this.getAuth0Config()
    const response = await fetch(`${config.issuer}oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
      signal: AbortSignal.timeout(auth0RequestTimeoutMs),
    }).catch(() => {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    })

    const result: unknown = await response.json().catch(() => null)
    if (isRecord(result) && result.error === 'invalid_grant') {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' })
    }
    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    }
    if (
      !isRecord(result) ||
      typeof result.access_token !== 'string' ||
      result.access_token.length === 0
    ) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_INVALID_RESPONSE',
      })
    }

    return {
      token: result.access_token,
      refreshToken:
        typeof result.refresh_token === 'string' &&
        result.refresh_token.length > 0
          ? result.refresh_token
          : refreshToken,
    }
  }

  async login(email: string, password: string): Promise<LoginResponseDto> {
    // Las credenciales solo viajan del router al endpoint de tokens de Auth0.
    const config = this.getAuth0Config()
    const response = await fetch(`${config.issuer}oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        username: email,
        password,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        audience: config.audience,
        scope: 'openid profile email offline_access',
      }),
      signal: AbortSignal.timeout(auth0RequestTimeoutMs),
    }).catch(() => {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    })

    const result: unknown = await response.json().catch(() => null)
    if (isRecord(result) && result.error === 'invalid_grant') {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
    }
    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    }
    if (
      !isRecord(result) ||
      typeof result.access_token !== 'string' ||
      result.access_token.length === 0
    ) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_INVALID_RESPONSE',
      })
    }

    return {
      accessToken: result.access_token,
      ...(typeof result.expires_in === 'number'
        ? { expiresIn: result.expires_in }
        : {}),
      ...(typeof result.refresh_token === 'string' &&
      result.refresh_token.length > 0
        ? { refreshToken: result.refresh_token }
        : {}),
    }
  }

  async getAuthenticatedUser(authorization?: string): Promise<MeResponseDto> {
    // La API valida el Access Token antes de aceptar rutas protegidas.
    const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1]
    if (token === undefined) throw this.invalidToken()

    const config = this.getAuth0Config()
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
    if (
      encodedHeader === undefined ||
      encodedPayload === undefined ||
      encodedSignature === undefined
    ) {
      throw this.invalidToken()
    }

    let header: unknown
    let payload: unknown
    let signature: Buffer
    try {
      header = JSON.parse(
        Buffer.from(encodedHeader, 'base64url').toString('utf8'),
      )
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      )
      signature = Buffer.from(encodedSignature, 'base64url')
    } catch {
      throw this.invalidToken()
    }

    if (!isJwtHeader(header) || !isJwtPayload(payload))
      throw this.invalidToken()

    let keys = await this.getSigningKeys(config.issuer).catch(() => {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
      })
    })
    let jwk = keys.find((key) => key.kid === header.kid)
    if (jwk === undefined) {
      keys = await this.getSigningKeys(config.issuer, true).catch(() => {
        throw new ServiceUnavailableException({
          code: 'AUTH_PROVIDER_UNAVAILABLE',
        })
      })
      jwk = keys.find((key) => key.kid === header.kid)
    }
    if (jwk === undefined) throw this.invalidToken()

    let signatureIsValid = false
    try {
      signatureIsValid = verify(
        'RSA-SHA256',
        Buffer.from(`${encodedHeader}.${encodedPayload}`),
        createPublicKey({ key: jwk, format: 'jwk' }),
        signature,
      )
    } catch {
      throw this.invalidToken()
    }

    const now = Math.floor(Date.now() / 1000)
    const audienceMatches =
      payload.aud === config.audience ||
      (Array.isArray(payload.aud) &&
        payload.aud.some((value) => value === config.audience))
    const issuerMatches = payload.iss === config.issuer

    if (
      !signatureIsValid ||
      !issuerMatches ||
      !audienceMatches ||
      payload.exp <= now ||
      (payload.nbf !== undefined && payload.nbf > now)
    ) {
      throw this.invalidToken()
    }

    return { email: normalizeAuthEmail(payload.email) }
  }

  private getAuth0Config(): {
    issuer: string
    clientId: string
    clientSecret: string
    audience: string
  } {
    const domain = process.env.AUTH0_DOMAIN?.trim()
    const clientId = process.env.AUTH0_CLIENT_ID?.trim()
    const clientSecret = process.env.AUTH0_CLIENT_SECRET?.trim()
    const audience = process.env.AUTH0_AUDIENCE?.trim()

    if (!domain || !clientId || !clientSecret || !audience) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_NOT_CONFIGURED',
      })
    }

    let tenantUrl: URL
    try {
      tenantUrl = new URL(
        domain.startsWith('https://') ? domain : `https://${domain}`,
      )
    } catch {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_NOT_CONFIGURED',
      })
    }
    if (
      tenantUrl.protocol !== 'https:' ||
      tenantUrl.username !== '' ||
      tenantUrl.password !== '' ||
      tenantUrl.pathname !== '/' ||
      tenantUrl.search !== '' ||
      tenantUrl.hash !== ''
    ) {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_NOT_CONFIGURED',
      })
    }

    return {
      issuer: `${tenantUrl.origin}/`,
      clientId,
      clientSecret,
      audience,
    }
  }

  private async getSigningKeys(
    issuer: string,
    refresh = false,
  ): Promise<Auth0RsaKey[]> {
    if (
      !refresh &&
      this.cachedKeys.length > 0 &&
      this.cachedKeysUntil > Date.now()
    ) {
      return this.cachedKeys
    }

    const response = await fetch(`${issuer}.well-known/jwks.json`, {
      signal: AbortSignal.timeout(auth0RequestTimeoutMs),
    })
    if (!response.ok) throw new Error('JWKS request failed')

    const keySet: unknown = await response.json()
    if (!isRecord(keySet) || !Array.isArray(keySet.keys))
      throw new Error('JWKS response is invalid')

    const rawKeys: unknown[] = keySet.keys
    this.cachedKeys = rawKeys.filter(isAuth0RsaKey)
    this.cachedKeysUntil = Date.now() + jwksCacheDurationMs
    return this.cachedKeys
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({ code: 'INVALID_TOKEN' })
  }
}
