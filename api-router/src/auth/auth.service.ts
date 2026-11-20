import { createPublicKey, verify, type JsonWebKey as CryptoJsonWebKey } from 'node:crypto'
import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { LoginResponseDto } from './login-response.dto'
import { MeResponseDto } from './me-response.dto'

type Auth0TokenResponse = {
  access_token?: unknown
  expires_in?: unknown
  error?: unknown
}

type JwtHeader = { alg?: unknown; kid?: unknown }
type JwtPayload = {
  aud?: unknown
  exp?: unknown
  iss?: unknown
  nbf?: unknown
  sub?: unknown
}
type Auth0JsonWebKey = {
  kid?: string
  kty?: string
  [key: string]: unknown
}
type JsonWebKeySet = { keys?: Auth0JsonWebKey[] }

const auth0RequestTimeoutMs = 10_000
const jwksCacheDurationMs = 5 * 60_000

@Injectable()
export class AuthService {
  private cachedKeys: Auth0JsonWebKey[] = []
  private cachedKeysUntil = 0

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
        scope: 'openid profile email'
      }),
      signal: AbortSignal.timeout(auth0RequestTimeoutMs)
    }).catch(() => {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_UNAVAILABLE' })
    })

    const result = (await response.json().catch(() => ({}))) as Auth0TokenResponse
    if (result.error === 'invalid_grant') {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
    }
    if (!response.ok) {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_UNAVAILABLE' })
    }
    if (typeof result.access_token !== 'string' || result.access_token.length === 0) {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_INVALID_RESPONSE' })
    }

    return {
      accessToken: result.access_token,
      ...(typeof result.expires_in === 'number' ? { expiresIn: result.expires_in } : {})
    }
  }

  async getAuthenticatedUser(authorization?: string): Promise<MeResponseDto> {
    // La API valida el Access Token antes de aceptar rutas protegidas.
    const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1]
    if (token === undefined) throw this.invalidToken()

    const config = this.getAuth0Config()
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
    if (encodedHeader === undefined || encodedPayload === undefined || encodedSignature === undefined) {
      throw this.invalidToken()
    }

    let header: JwtHeader
    let payload: JwtPayload
    let signature: Buffer
    try {
      header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as JwtHeader
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload
      signature = Buffer.from(encodedSignature, 'base64url')
    } catch {
      throw this.invalidToken()
    }

    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw this.invalidToken()

    let keys = await this.getSigningKeys(config.issuer).catch(() => {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_UNAVAILABLE' })
    })
    let jwk = keys.find((key) => key.kid === header.kid && key.kty === 'RSA')
    if (jwk === undefined) {
      keys = await this.getSigningKeys(config.issuer, true).catch(() => {
        throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_UNAVAILABLE' })
      })
      jwk = keys.find((key) => key.kid === header.kid && key.kty === 'RSA')
    }
    if (jwk === undefined) throw this.invalidToken()

    let signatureIsValid = false
    try {
      signatureIsValid = verify(
        'RSA-SHA256',
        Buffer.from(`${encodedHeader}.${encodedPayload}`),
        createPublicKey({ key: jwk as unknown as CryptoJsonWebKey, format: 'jwk' }),
        signature
      )
    } catch {
      throw this.invalidToken()
    }

    const now = Math.floor(Date.now() / 1000)
    const audienceMatches =
      payload.aud === config.audience ||
      (Array.isArray(payload.aud) && payload.aud.some((value) => value === config.audience))
    const issuerMatches = payload.iss === config.issuer

    if (
      !signatureIsValid ||
      !issuerMatches ||
      !audienceMatches ||
      typeof payload.exp !== 'number' ||
      payload.exp <= now ||
      (payload.nbf !== undefined &&
        (typeof payload.nbf !== 'number' || payload.nbf > now)) ||
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0
    ) {
      throw this.invalidToken()
    }

    return { sub: payload.sub }
  }

  private getAuth0Config(): { issuer: string; clientId: string; clientSecret: string; audience: string } {
    const domain = process.env.AUTH0_DOMAIN?.trim()
    const clientId = process.env.AUTH0_CLIENT_ID?.trim()
    const clientSecret = process.env.AUTH0_CLIENT_SECRET?.trim()
    const audience = process.env.AUTH0_AUDIENCE?.trim()

    if (!domain || !clientId || !clientSecret || !audience) {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_NOT_CONFIGURED' })
    }

    let tenantUrl: URL
    try {
      tenantUrl = new URL(domain.startsWith('https://') ? domain : `https://${domain}`)
    } catch {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_NOT_CONFIGURED' })
    }
    if (
      tenantUrl.protocol !== 'https:' ||
      tenantUrl.username !== '' ||
      tenantUrl.password !== '' ||
      tenantUrl.pathname !== '/' ||
      tenantUrl.search !== '' ||
      tenantUrl.hash !== ''
    ) {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_NOT_CONFIGURED' })
    }

    return {
      issuer: `${tenantUrl.origin}/`,
      clientId,
      clientSecret,
      audience
    }
  }

  private async getSigningKeys(issuer: string, refresh = false): Promise<Auth0JsonWebKey[]> {
    if (!refresh && this.cachedKeys.length > 0 && this.cachedKeysUntil > Date.now()) {
      return this.cachedKeys
    }

    const response = await fetch(`${issuer}.well-known/jwks.json`, {
      signal: AbortSignal.timeout(auth0RequestTimeoutMs)
    })
    if (!response.ok) throw new Error('JWKS request failed')

    const keySet = (await response.json()) as JsonWebKeySet
    if (!Array.isArray(keySet.keys)) throw new Error('JWKS response is invalid')

    this.cachedKeys = keySet.keys
    this.cachedKeysUntil = Date.now() + jwksCacheDurationMs
    return this.cachedKeys
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({ code: 'INVALID_TOKEN' })
  }
}
