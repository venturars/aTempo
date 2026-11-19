import { ApiProperty } from '@nestjs/swagger'

export class OrganizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  tax_id!: string
}
