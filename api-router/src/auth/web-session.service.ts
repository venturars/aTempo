import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginResponseDto } from './login-response.dto'
import { WebSessionDto } from './web-session.dto'

type WebProfile = WebSessionDto['profile']

const allowedProfiles: Record<string, WebProfile> = {
  'profesor@atempo.test': 'admin',
  'ada.lopez@clase.test': 'student',
}

@Injectable()
export class WebSessionService {
  constructor(private readonly authService: AuthService) {}

  async login(
    emailInput: string,
    password: string,
  ): Promise<{ tokens: LoginResponseDto; user: WebSessionDto }> {
    const email = emailInput.trim().toLowerCase()
    const tokens = await this.authService.login(email, password)
    const profile = allowedProfiles[email]

    if (profile === undefined) {
      await this.revoke(tokens.refreshToken)
      throw this.invalidCredentials()
    }

    let authenticatedUser: { sub: string }
    try {
      authenticatedUser = await this.authService.getAuthenticatedUser(
        `Bearer ${tokens.accessToken}`,
      )
    } catch (error) {
      await this.revoke(tokens.refreshToken)
      throw error
    }

    return {
      tokens,
      user: { sub: authenticatedUser.sub, email, profile },
    }
  }

  serializeIdentity(email: string, profile: WebProfile): string {
    return JSON.stringify({ email, profile })
  }

  parseIdentity(value: string | undefined): {
    email: string
    profile: WebProfile
  } | undefined {
    if (value === undefined) return undefined
    try {
      const parsed: unknown = JSON.parse(value)
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('email' in parsed) ||
        !('profile' in parsed)
      ) {
        return undefined
      }
      const email = parsed.email
      const profile = parsed.profile
      if (
        typeof email !== 'string' ||
        (profile !== 'admin' && profile !== 'student')
      ) {
        return undefined
      }
      return { email, profile }
    } catch {
      return undefined
    }
  }

  async revoke(refreshToken: string | undefined): Promise<void> {
    if (refreshToken === undefined) return
    try {
      await this.authService.logout(refreshToken)
    } catch {
      // La cookie se borra aunque Auth0 no responda a la revocación.
    }
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
  }
}
