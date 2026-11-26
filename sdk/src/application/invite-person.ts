import { randomUUID } from 'node:crypto'
import { OrganizationRepository } from '../domain/organization-repository'
import { Person } from '../domain/person'
import { PersonRole } from '../domain/person-role'
import { asUuid, parseUuid } from '../domain/scalars'
import { normalizePersonFields } from '../domain/person-fields'
import { PersonRepository } from '../domain/person-repository'
import { assertRoleSet } from '../domain/roles'
import { assertUniquePersonKeys } from '../domain/uniqueness'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type InvitePersonInput = {
  organizationId: string
  firstName: string
  lastName: string
  identificationDocument: string
  email: string
  birthDate?: string | null
  phone?: string | null
  role: PersonRole
}

export type InvitePersonDeps = {
  organizations: OrganizationRepository
  persons: PersonRepository
}

export function createInvitePerson(deps: InvitePersonDeps) {
  return async function invitePerson(
    input: InvitePersonInput,
  ): Promise<Result<Person>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId

    const organization = await deps.organizations.findById(organizationId.value)
    if (!organization) {
      return err(new AppError('NOT_FOUND', 'La organización no existe.'))
    }
    if (input.role === 'organization_admin') {
      return err(
        new AppError('VALIDATION', 'No se puede invitar a otro administrador.'),
      )
    }
    if (input.role !== 'teacher' && input.role !== 'student') {
      return err(new AppError('VALIDATION', 'El rol no es válido.'))
    }
    const roles: PersonRole[] = [input.role]
    const roleSet = assertRoleSet(roles)
    if (!roleSet.ok) return roleSet
    const fields = normalizePersonFields(input)
    if (!fields.ok) return fields
    const uniquePerson = await assertUniquePersonKeys(
      deps.persons,
      fields.value,
    )
    if (!uniquePerson.ok) return uniquePerson

    const person: Person = {
      id: asUuid(randomUUID()),
      organizationId: organization.id,
      ...fields.value,
      roles,
      invitationStatus: 'pending',
    }
    await deps.persons.save(person)
    return ok(person)
  }
}
