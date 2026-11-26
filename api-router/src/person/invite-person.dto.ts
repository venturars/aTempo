import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator'

export class InvitePersonDto {
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

  @ApiProperty({ enum: ['teacher', 'student'] })
  @IsIn(['teacher', 'student'])
  role!: 'teacher' | 'student'
}
