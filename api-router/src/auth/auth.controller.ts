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
import {
  defaultWebOrigin,
  webSessionCookieName,
  WebSessionService,
} from './web-session.service'
import { WebSessionDto } from './web-session.dto'

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
  @ApiOperation({ summary: 'Revoca el Refresh Token en Auth0' })
  @ApiBody({ type: LogoutRequestDto })
  @ApiOkResponse({ type: LogoutResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh Token ausente o no válido' })
  logout(@Body() body: LogoutRequestDto): Promise<LogoutResponseDto> {
    return this.authService.logout(body.refreshToken)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el Access Token con el Refresh Token' })
  @ApiBody({ type: RefreshRequestDto })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh Token inválido o expirado' })
  @ApiResponse({
    status: 503,
    description: 'Auth0 no está configurado o no responde',
  })
  refresh(@Body() body: RefreshRequestDto): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(body.refreshToken)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Intercambia credenciales por un Access Token de Auth0',
  })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales no válidas' })
  @ApiResponse({
    status: 503,
    description: 'Auth0 no está configurado o no responde',
  })
  login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(body.email, body.password)
  }

  @Get('me')
  @ApiOperation({ summary: 'Comprueba el Access Token enviado como Bearer' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <accessToken>' })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access Token ausente o no válido' })
  me(@Headers('authorization') authorization?: string): Promise<MeResponseDto> {
    return this.authService.getAuthenticatedUser(authorization)
  }

  @Post('web/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abre una sesión web con cookie HttpOnly' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: WebSessionDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales no válidas' })
  async webLogin(
    @Body() body: LoginRequestDto,
    @Headers('origin') origin: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WebSessionDto> {
    this.requireWebOrigin(origin)
    response.setHeader('Cache-Control', 'no-store')
    const previousSessionId = readCookie(
      request.headers.cookie,
      webSessionCookieName,
    )
    const result = await this.webSessionService.login(
      body.email,
      body.password,
      previousSessionId,
    )
    response.cookie(webSessionCookieName, result.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isSecureRequest(request),
    })
    return result.user
  }

  @Get('web/session')
  @ApiOperation({ summary: 'Consulta y renueva la sesión web actual' })
  @ApiOkResponse({ type: WebSessionDto })
  @ApiUnauthorizedResponse({ description: 'La sesión web no existe o ha caducado' })
  async webSession(
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WebSessionDto> {
    response.setHeader('Cache-Control', 'no-store')
    const sessionId = readCookie(cookieHeader, webSessionCookieName)
    try {
      return await this.webSessionService.getSession(sessionId)
    } catch (error) {
      clearWebSessionCookie(response, request)
      throw error
    }
  }

  @Post('web/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cierra la sesión web y revoca su refresh token' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Sesión cerrada' })
  async webLogout(
    @Headers('origin') origin: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    this.requireWebOrigin(origin)
    response.setHeader('Cache-Control', 'no-store')
    const sessionId = readCookie(cookieHeader, webSessionCookieName)
    await this.webSessionService.logout(sessionId)
    clearWebSessionCookie(response, request)
  }

  private requireWebOrigin(origin: string | undefined): void {
    const configuredOrigin = process.env.ATEMPO_WEB_ORIGIN?.trim() || defaultWebOrigin
    if (origin !== configuredOrigin) {
      throw new ForbiddenException({ code: 'WEB_ORIGIN_NOT_ALLOWED' })
    }
  }
}

function readCookie(header: string | undefined, name: string): string | undefined {
  const cookie = header?.split(';').map((part) => part.trim()).find((part) => {
    return part.startsWith(`${name}=`)
  })
  return cookie?.slice(name.length + 1) || undefined
}

function clearWebSessionCookie(response: Response, request: Request): void {
  response.clearCookie(webSessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isSecureRequest(request),
  })
}

function isSecureRequest(request: Request): boolean {
  const forwardedProtocol = request.headers['x-forwarded-proto']
  const protocol = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol
  return (
    request.secure ||
    protocol?.split(',')[0]?.trim() === 'https'
  )
}
