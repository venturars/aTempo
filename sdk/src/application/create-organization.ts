import { randomUUID } from 'node:crypto'
import { parseTaxId } from '../domain/identifier'
import { parseNonEmptyText } from '../domain/text'
import { Organization } from '../domain/organization'
import { OrganizationRepository } from '../domain/organization-repository'
import { Person } from '../domain/person'
import { asUuid } from '../domain/scalars'
import { normalizePersonFields } from '../domain/person-fields'
import { PersonRepository } from '../domain/person-repository'
import { assertUniquePersonKeys, assertUniqueTaxId } from '../domain/uniqueness'
import { ok, Result } from '../shared/result'

export type CreateOrganizationInput = {
  name: string
  taxId: string
  firstName: string
  lastName: string
  identificationDocument: string
  email: string
  birthDate?: string | null
  phone?: string | null
}

export type CreateOrganizationValue = {
  organization: Organization
  person: Person
}

export type CreateOrganizationDeps = {
  organizations: OrganizationRepository
  persons: PersonRepository
}

export function createCreateOrganization(deps: CreateOrganizationDeps) {
  return async function createOrganization(
    input: CreateOrganizationInput,
  ): Promise<Result<CreateOrganizationValue>> {
    const name = parseNonEmptyText(input.name, 'El nombre')
    if (!name.ok) return name
    const taxId = parseTaxId(input.taxId)
    if (!taxId.ok) return taxId
    const fields = normalizePersonFields(input)
    if (!fields.ok) return fields

    const uniqueTax = await assertUniqueTaxId(deps.organizations, taxId.value)
    if (!uniqueTax.ok) return uniqueTax
    const uniquePerson = await assertUniquePersonKeys(
      deps.persons,
      fields.value,
    )
    if (!uniquePerson.ok) return uniquePerson

    const organization: Organization = {
      id: asUuid(randomUUID()),
      name: name.value,
      taxId: taxId.value,
    }
    const person: Person = {
      id: asUuid(randomUUID()),
      organizationId: organization.id,
      ...fields.value,
      roles: ['organization_admin'],
      invitationStatus: 'active',
    }
    await deps.organizations.save(organization)
    await deps.persons.save(person)
    return ok({ organization, person })
  }
}
