import { ApiProperty } from '@nestjs/swagger'

export class PersonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  organization_id!: string

  @ApiProperty()
  identification_document!: string

  @ApiProperty()
  email!: string

  @ApiProperty()
  first_name!: string

  @ApiProperty()
  last_name!: string

  @ApiProperty({ type: String, format: 'date', nullable: true })
  birth_date!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ enum: ['pending', 'active'] })
  invitation_status!: 'pending' | 'active'
}