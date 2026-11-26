import { ApiProperty } from '@nestjs/swagger'
import type { Organization } from 'atempo-sdk'
import { PersonResponseDto } from '../person/person-response.dto'

export class OrganizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  tax_id!: string
}

export class CreateOrganizationResponseDto {
  @ApiProperty({ type: OrganizationResponseDto })
  organization!: OrganizationResponseDto

  @ApiProperty({ type: PersonResponseDto })
  person!: PersonResponseDto
}

export function toOrganizationJson(
  organization: Organization,
): OrganizationResponseDto {
  return {
    id: organization.id,
    name: organization.name,
    tax_id: organization.taxId,
  }
}
