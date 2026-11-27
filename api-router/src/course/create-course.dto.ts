import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

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
  start_at!: string

  @ApiProperty({ type: String, format: 'date-time' })
  @IsString()
  @MinLength(1)
  end_at!: string

  @ApiProperty({ example: '0x0000000000000000000000000000000000000001' })
  @IsString()
  @MinLength(1)
  contract_address!: string
}