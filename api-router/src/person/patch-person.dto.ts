import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import type { PersonRole } from 'atempo-sdk'

export class PatchPersonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  first_name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  last_name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  identification_document?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birth_date?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({
    isArray: true,
    enum: ['organization_admin', 'teacher', 'student'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['organization_admin', 'teacher', 'student'], { each: true })
  roles?: PersonRole[]
}
