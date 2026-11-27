import { ApiProperty } from '@nestjs/swagger'

export class WebSessionDto {
  @ApiProperty({ example: 'profesor@atempo.test' })
  email!: string

  @ApiProperty({ enum: ['admin', 'student'], example: 'admin' })
  profile!: 'admin' | 'student'
}
