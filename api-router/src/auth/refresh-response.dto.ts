import { ApiProperty } from '@nestjs/swagger'

export class RefreshResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEifQ...',
  })
  token!: string

  @ApiProperty({
    example: 'nVoN2pQrS7tU8vW9xY0zAbCdEfGhIjKlMnOpQrStUvW0a1b2c3d4e5f6g7h8',
  })
  refreshToken!: string
}
