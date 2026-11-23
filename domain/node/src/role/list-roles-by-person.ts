import { listRolesByPersonId } from '../postgres/repositories/role'
import { assertUuid } from '../types/assert'
import { assertRole, type Role } from '../types/role'

export type ListRolesByPersonInput = {
  personId: string
}

export type ListRolesByPersonOutput = {
  roles: Role[]
}

export async function listRolesByPerson(
  input: ListRolesByPersonInput,
): Promise<ListRolesByPersonOutput> {
  const personId = assertUuid(input.personId, 'person.id')
  const rows = await listRolesByPersonId(personId)
  return { roles: rows.map((row) => assertRole(row)) }
}
