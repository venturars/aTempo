import { ApiProperty } from '@nestjs/swagger'

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  organization_id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  acronym!: string

  @ApiProperty({ type: String, format: 'date-time' })
  start_at!: string

  @ApiProperty({ type: String, format: 'date-time' })
  end_at!: string

  @ApiProperty()
  contract_address!: string
}
