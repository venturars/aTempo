import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterRequestDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'SecurePass123!', minLength: 8, writeOnly: true })
  @IsString()
  @MinLength(8)
  password!: string
}
