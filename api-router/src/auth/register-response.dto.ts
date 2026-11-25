import { ApiProperty } from '@nestjs/swagger'

export class RegisterResponseDto {
  @ApiProperty({ example: 'auth0|507f1f77bcf86cd799439011' })
  userId!: string

  @ApiProperty({
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEifQ.H1X_N-....',
  })
  token!: string

  @ApiProperty({
    example: 'bWxLH0UcMx7K5mQ2qVz9pR8eJ6nW3hA4bYcDfG7iJoPs0s1t2u3v4w5x6y7z8',
  })
  refreshToken!: string
}
