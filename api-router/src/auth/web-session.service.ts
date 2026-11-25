import { randomBytes } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { WebSessionDto } from './web-session.dto'

export const webSessionCookieName = 'atempo_session'
export const defaultWebOrigin = 'http://localhost:5191'

type WebProfile = WebSessionDto['profile']

type StoredWebSession = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  absoluteExpiresAt: number
  sub: string
  email: string
  profile: WebProfile
}

const allowedProfiles: Record<string, WebProfile> = {
  'profesor@atempo.test': 'admin',
  'ada.lopez@clase.test': 'student'
}
const absoluteSessionLifetimeMs = 7 * 24 * 60 * 60 * 1000
const maximumStoredSessions = 10_000

// La cookie solo identifica la sesión; los tokens permanecen en este proceso.
@Injectable()
export class WebSessionService {
  private readonly sessions = new Map<string, StoredWebSession>()

  constructor(private readonly authService: AuthService) {}

  async login(
    emailInput: string,
    password: string,
    previousSessionId?: string,
  ): Promise<{
    sessionId: string
    user: WebSessionDto
  }> {
    const email = emailInput.trim().toLowerCase()
    const auth = await this.authService.login(email, password)
    const profile = allowedProfiles[email]

    if (profile === undefined) {
      await this.revoke(auth.refreshToken)
      throw this.invalidCredentials()
    }

    let authenticatedUser: { sub: string }
    try {
      authenticatedUser = await this.authService.getAuthenticatedUser(
        `Bearer ${auth.accessToken}`,
      )
    } catch (error) {
      await this.revoke(auth.refreshToken)
      throw error
    }

    await this.logout(previousSessionId)
    await this.removeExpiredSessions()
    await this.makeRoomForSession()

    const sessionId = randomBytes(32).toString('base64url')
    const now = Date.now()
    this.sessions.set(sessionId, {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAt: tokenExpiresAt(auth.accessToken, auth.expiresIn),
      absoluteExpiresAt: now + absoluteSessionLifetimeMs,
      sub: authenticatedUser.sub,
      email,
      profile,
    })

    return {
      sessionId,
      user: { sub: authenticatedUser.sub, email, profile },
    }
  }

  async getSession(sessionId: string | undefined): Promise<WebSessionDto> {
    if (sessionId === undefined) throw this.invalidCredentials()
    const session = this.sessions.get(sessionId)
    if (session === undefined) throw this.invalidCredentials()

    try {
      if (session.absoluteExpiresAt <= Date.now()) throw this.invalidCredentials()
      if (session.expiresAt <= Date.now()) {
        await this.refresh(session)
      }

      let user: { sub: string }
      try {
        user = await this.authService.getAuthenticatedUser(
          `Bearer ${session.accessToken}`,
        )
      } catch (error) {
        if (
          !(error instanceof UnauthorizedException) ||
          session.refreshToken === undefined
        ) {
          throw error
        }
        await this.refresh(session)
        user = await this.authService.getAuthenticatedUser(
          `Bearer ${session.accessToken}`,
        )
      }
      if (user.sub !== session.sub) throw this.invalidCredentials()
      return { sub: session.sub, email: session.email, profile: session.profile }
    } catch (error) {
      this.sessions.delete(sessionId)
      await this.revoke(session.refreshToken)
      throw error
    }
  }

  async logout(sessionId: string | undefined): Promise<void> {
    if (sessionId === undefined) return
    const session = this.sessions.get(sessionId)
    this.sessions.delete(sessionId)
    if (session?.refreshToken !== undefined) await this.revoke(session.refreshToken)
  }

  private async revoke(refreshToken: string | undefined): Promise<void> {
    if (refreshToken === undefined) return
    try {
      await this.authService.logout(refreshToken)
    } catch {
      // La sesión web se elimina aunque Auth0 no responda a la revocación.
    }
  }

  private async refresh(session: StoredWebSession): Promise<void> {
    if (session.refreshToken === undefined) throw this.invalidCredentials()
    const refreshed = await this.authService.refreshToken(session.refreshToken)
    session.accessToken = refreshed.token
    session.refreshToken = refreshed.refreshToken
    session.expiresAt = tokenExpiresAt(refreshed.token)
  }

  private async removeExpiredSessions(): Promise<void> {
    const now = Date.now()
    for (const [sessionId, session] of this.sessions) {
      if (session.absoluteExpiresAt > now) continue
      this.sessions.delete(sessionId)
      await this.revoke(session.refreshToken)
    }
  }

  private async makeRoomForSession(): Promise<void> {
    while (this.sessions.size >= maximumStoredSessions) {
      const oldestSessionId = this.sessions.keys().next().value
      if (oldestSessionId === undefined) return
      await this.logout(oldestSessionId)
    }
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
  }
}

function tokenExpiresAt(accessToken: string, expiresIn?: number): number {
  if (expiresIn !== undefined) return Date.now() + expiresIn * 1000

  try {
    const encodedPayload = accessToken.split('.')[1]
    if (encodedPayload === undefined) return Date.now()
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    )
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'exp' in payload &&
      typeof payload.exp === 'number'
    ) {
      return payload.exp * 1000
    }
  } catch {
    // Un token sin expiración legible fuerza una renovación en servidor.
  }

  return Date.now()
}
