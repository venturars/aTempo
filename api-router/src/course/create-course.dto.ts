import { ApiProperty } from '@nestjs/swagger'
import { IsISO8601, IsString, Matches, MinLength } from 'class-validator'

const CONTRACT_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  acronym!: string

  @ApiProperty({ type: String, format: 'date-time' })
  @IsString()
  @MinLength(1)
  @IsISO8601({}, { message: 'La fecha de inicio debe ser una fecha ISO 8601.' })
  start_at!: string

  @ApiProperty({ type: String, format: 'date-time' })
  @IsString()
  @MinLength(1)
  @IsISO8601({}, { message: 'La fecha de fin debe ser una fecha ISO 8601.' })
  end_at!: string

  @ApiProperty({ example: '0x0000000000000000000000000000000000000001' })
  @IsString()
  @MinLength(1)
  @Matches(CONTRACT_ADDRESS_PATTERN, {
    message:
      'La dirección del contrato debe ser 0x seguido de 40 dígitos hexadecimales.',
  })
  contract_address!: string
}