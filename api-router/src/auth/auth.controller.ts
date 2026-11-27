import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginRequestDto } from './login-request.dto'
import { LoginResponseDto } from './login-response.dto'
import { LogoutRequestDto } from './logout-request.dto'
import { LogoutResponseDto } from './logout-response.dto'
import { MeResponseDto } from './me-response.dto'
import { RefreshRequestDto } from './refresh-request.dto'
import { RefreshResponseDto } from './refresh-response.dto'
import { RegisterRequestDto } from './register-request.dto'
import { RegisterResponseDto } from './register-response.dto'
import { WebSessionDto } from './web-session.dto'
import { WebSessionService } from './web-session.service'
import {
  accessCookieName,
  clearAuthCookies,
  configuredWebOrigin,
  refreshCookieName,
  identityCookieName,
  readCookie,
  setAuthCookies,
} from '../shared/cookies'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly webSessionService: WebSessionService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un usuario Auth0 y devuelve tokens' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiConflictResponse({ description: 'El email ya existe' })
  @ApiResponse({ status: 400, description: 'Email o contraseña no válidos' })
  @ApiResponse({
    status: 503,
    description: 'Auth0 no está configurado o no responde',
  })
  register(@Body() body: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.authService.register(body.email, body.password)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoca el refresh token (cuerpo Electron o cookie web)',
  })
  @ApiBody({ type: LogoutRequestDto, required: false })
  @ApiOkResponse({ type: LogoutResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh Token ausente o no válido' })
  async logout(
    @Body() body: LogoutRequestDto,
    @Headers('origin') origin: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponseDto> {
    this.rejectForeignOrigin(origin)
    if (this.isWebOrigin(origin)) {
      response.setHeader('Cache-Control', 'no-store')
      const refreshToken = readCookie(cookieHeader, refreshCookieName)
      await this.webSessionService.revoke(refreshToken)
      clearAuthCookies(response, request)
      return { success: true }
    }
    if (typeof body?.refreshToken === 'string' && body.refreshToken.length > 0) {
      return this.authService.logout(body.refreshToken)
    }
    throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renueva el Access Token con el Refresh Token o la cookie web',
  })
  @ApiBody({ type: RefreshRequestDto, required: false })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh Token inválido o expirado' })
  @ApiResponse({
    status: 503,
    description: 'Auth0 no está configurado o no responde',
  })
  async refresh(
    @Body() body: RefreshRequestDto,
    @Headers('origin') origin: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto | Record<string, never>> {
    this.rejectForeignOrigin(origin)
    if (this.isWebOrigin(origin)) {
      response.setHeader('Cache-Control', 'no-store')
      const refreshToken = readCookie(cookieHeader, refreshCookieName)
      const identity = this.webSessionService.parseIdentity(
        readCookie(cookieHeader, identityCookieName),
      )
      if (refreshToken === undefined || identity === undefined) {
        clearAuthCookies(response, request)
        throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
      }
      try {
        const tokens = await this.authService.refreshToken(refreshToken)
        setAuthCookies(response, request, {
          accessToken: tokens.token,
          refreshToken: tokens.refreshToken,
          identity: this.webSessionService.serializeIdentity(
            identity.email,
            identity.profile,
          ),
        })
        return {}
      } catch (error) {
        clearAuthCookies(response, request)
        throw error
      }
    }
    if (typeof body?.refreshToken === 'string' && body.refreshToken.length > 0) {
      return this.authService.refreshToken(body.refreshToken)
    }
    throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' })
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Intercambia credenciales por tokens Auth0 o por cookies HttpOnly en la web',
  })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales no válidas' })
  @ApiResponse({
    status: 503,
    description: 'Auth0 no está configurado o no responde',
  })
  async login(
    @Body() body: LoginRequestDto,
    @Headers('origin') origin: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto | WebSessionDto> {
    this.rejectForeignOrigin(origin)
    if (this.isWebOrigin(origin)) {
      response.setHeader('Cache-Control', 'no-store')
      const previousRefresh = readCookie(cookieHeader, refreshCookieName)
      await this.webSessionService.revoke(previousRefresh)
      const result = await this.webSessionService.login(body.email, body.password)
      setAuthCookies(response, request, {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        identity: this.webSessionService.serializeIdentity(
          result.user.email,
          result.user.profile,
        ),
      })
      return result.user
    }
    return this.authService.login(body.email, body.password)
  }

  @Get('me')
  @ApiOperation({
    summary: 'Comprueba el Access Token Bearer o la cookie web',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <accessToken>',
    required: false,
  })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access Token ausente o no válido' })
  async me(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MeResponseDto | WebSessionDto> {
    const accessToken = readCookie(cookieHeader, accessCookieName)
    const identity = this.webSessionService.parseIdentity(
      readCookie(cookieHeader, identityCookieName),
    )
    if (authorization !== undefined && authorization.length > 0) {
      return this.authService.getAuthenticatedUser(authorization)
    }
    if (accessToken === undefined || identity === undefined) {
      return this.authService.getAuthenticatedUser(authorization)
    }
    response.setHeader('Cache-Control', 'no-store')
    await this.authService.getAuthenticatedUser(`Bearer ${accessToken}`)
    return {
      email: identity.email,
      profile: identity.profile,
    }
  }

  private isWebOrigin(origin: string | undefined): boolean {
    return origin === configuredWebOrigin()
  }

  private rejectForeignOrigin(origin: string | undefined): void {
    if (origin !== undefined && origin !== configuredWebOrigin()) {
      throw new ForbiddenException({ code: 'WEB_ORIGIN_NOT_ALLOWED' })
    }
  }
}
