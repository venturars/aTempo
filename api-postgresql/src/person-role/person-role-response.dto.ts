import { ApiProperty } from '@nestjs/swagger'

export class PersonRoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  person_id!: string

  @ApiProperty({ example: 'teacher' })
  role!: string
}