import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'

const CONTRACT_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/

function trimIfString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value
}

export class PatchCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimIfString(value))
  @IsString()
  @MinLength(1)
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimIfString(value))
  @IsString()
  @MinLength(1)
  acronym?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  @IsISO8601({}, { message: 'La fecha de inicio debe ser una fecha ISO 8601.' })
  start_at?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  @IsISO8601({}, { message: 'La fecha de fin debe ser una fecha ISO 8601.' })
  end_at?: string

  @ApiPropertyOptional({ example: '0x0000000000000000000000000000000000000001' })
  @IsOptional()
  @IsString()
  @Matches(CONTRACT_ADDRESS_PATTERN, {
    message:
      'La dirección del contrato debe ser 0x seguido de 40 dígitos hexadecimales.',
  })
  contract_address?: string
}
