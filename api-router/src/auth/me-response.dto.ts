import { ApiProperty } from '@nestjs/swagger'

export class MeResponseDto {
  @ApiProperty({ example: 'profesor@atempo.test' })
  email!: string
}
