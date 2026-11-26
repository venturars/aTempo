import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  tax_id!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  first_name!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  last_name!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  identification_document!: string

  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birth_date?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string
}
