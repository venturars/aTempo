import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common'
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginRequestDto } from './login-request.dto'
import { LoginResponseDto } from './login-response.dto'
import { MeResponseDto } from './me-response.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Intercambia credenciales por un Access Token de Auth0' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales no válidas' })
  @ApiResponse({ status: 503, description: 'Auth0 no está configurado o no responde' })
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
