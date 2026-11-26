import { OrganizationRepository } from '../domain/organization-repository'
import { Person } from '../domain/person'
import { PersonRepository } from '../domain/person-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type ListPeopleInput = { organizationId: string }

export type ListPeopleDeps = {
  organizations: OrganizationRepository
  persons: PersonRepository
}

export function createListPeople(deps: ListPeopleDeps) {
  return async function listPeople({
    organizationId,
  }: ListPeopleInput): Promise<Result<Person[]>> {
    const parsedId = parseUuid(organizationId)
    if (!parsedId.ok) return parsedId

    const organization = await deps.organizations.findById(parsedId.value)
    if (!organization) {
      return err(new AppError('NOT_FOUND', 'La organización no existe.'))
    }
    return ok(await deps.persons.listByOrganization(parsedId.value))
  }
}
