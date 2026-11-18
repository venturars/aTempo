import { ApiProperty } from '@nestjs/swagger'

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok'

  @ApiProperty({ example: 'ok', enum: ['ok'] })
  postgres!: 'ok'
}
