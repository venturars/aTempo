import { retrieveAllPersonsByRoleName } from '../postgres/executors/person'
import { assertPerson, type Person } from '../types/person'
import { assertRoleName, type RoleName } from '../types/role'

export type RetrieveAllPersonsByRoleInput = {
  roleName: RoleName
}

export type RetrieveAllPersonsByRoleOutput = {
  persons: Person[]
}

export async function retrieveAllPersonsByRole(
  input: RetrieveAllPersonsByRoleInput,
): Promise<RetrieveAllPersonsByRoleOutput> {
  const roleName = assertRoleName(input.roleName)
  const rows = await retrieveAllPersonsByRoleName(roleName)
  return { persons: rows.map((row) => assertPerson(row)) }
}
