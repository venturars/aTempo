import { ApiProperty } from '@nestjs/swagger'
import type {
  InvitationStatus,
  Organization,
  Person,
  PersonRole,
} from 'atempo-sdk'

export class OrganizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  tax_id!: string
}

export class PersonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  organization_id!: string

  @ApiProperty()
  first_name!: string

  @ApiProperty()
  last_name!: string

  @ApiProperty()
  identification_document!: string

  @ApiProperty()
  email!: string

  @ApiProperty({ type: String, format: 'date', nullable: true })
  birth_date!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({
    isArray: true,
    enum: ['organization_admin', 'teacher', 'student'],
  })
  roles!: PersonRole[]

  @ApiProperty({ enum: ['pending', 'active'] })
  invitation_status!: InvitationStatus
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

export function toPersonJson(person: Person): PersonResponseDto {
  return {
    id: person.id,
    organization_id: person.organizationId,
    first_name: person.firstName,
    last_name: person.lastName,
    identification_document: person.identificationDocument,
    email: person.email,
    birth_date: person.birthDate,
    phone: person.phone,
    roles: person.roles,
    invitation_status: person.invitationStatus,
  }
}
