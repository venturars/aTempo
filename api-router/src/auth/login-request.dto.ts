import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginRequestDto {
  @ApiProperty({ example: 'profesor@atempo.test' })
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 1, writeOnly: true })
  @IsString()
  @MinLength(1)
  password!: string
}
