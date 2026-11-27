import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class EnrollPersonDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  person_id!: string
}