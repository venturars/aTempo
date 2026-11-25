import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class LogoutRequestDto {
  @ApiProperty({
    example: 'bWxLH0UcMx7K5mQ2qVz9pR8eJ6nW3hA4bYcDfG7iJoPs0s1t2u3v4w5x6y7z8',
  })
  @IsString()
  @MinLength(1)
  refreshToken!: string
}
