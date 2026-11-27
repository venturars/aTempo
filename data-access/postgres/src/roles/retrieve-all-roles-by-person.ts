import { retrieveAllRolesByPersonId } from '../postgres/executors/role'
import { assertUuid } from '../shared/validation/assert'
import { assertRole } from '../shared/validation/role'
import type { Role } from '../shared/types/role'

export type RetrieveAllRolesByPersonInput = {
  personId: string
}

export type RetrieveAllRolesByPersonOutput = {
  roles: Role[]
}

export async function retrieveAllRolesByPerson(
  input: RetrieveAllRolesByPersonInput,
): Promise<RetrieveAllRolesByPersonOutput> {
  const personId = assertUuid(input.personId, 'person.id')
  const rows = await retrieveAllRolesByPersonId(personId)
  return { roles: rows.map((row) => assertRole(row)) }
}
