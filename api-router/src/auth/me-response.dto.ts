import { ApiProperty } from '@nestjs/swagger'

export class MeResponseDto {
  @ApiProperty({ example: 'auth0|abc123' })
  sub!: string
}
