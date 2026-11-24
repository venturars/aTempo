import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginResponseDto {
  @ApiProperty({ description: 'Access Token emitido por Auth0' })
  accessToken!: string

  @ApiPropertyOptional({ description: 'Duración del token en segundos' })
  expiresIn?: number

  @ApiPropertyOptional({ description: 'Refresh Token emitido por Auth0' })
  refreshToken?: string
}
