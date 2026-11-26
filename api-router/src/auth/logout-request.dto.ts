import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class LogoutRequestDto {
  @ApiPropertyOptional({
    example: 'bWxLH0UcMx7K5mQ2qVz9pR8eJ6nW3hA4bYcDfG7iJoPs0s1t2u3v4w5x6y7z8',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  refreshToken?: string
}
