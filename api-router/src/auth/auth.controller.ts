import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common'
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
