import { listPersonsByRoleName } from '../postgres/executors/person'
import { assertPerson, type Person } from '../types/person'
import { assertRoleName, type RoleName } from '../types/role'

export type ListPersonsByRoleInput = {
  roleName: RoleName
}

export type ListPersonsByRoleOutput = {
  persons: Person[]
}

export async function listPersonsByRole(
  input: ListPersonsByRoleInput,
): Promise<ListPersonsByRoleOutput> {
  const roleName = assertRoleName(input.roleName)
  const rows = await listPersonsByRoleName(roleName)
  return { persons: rows.map((row) => assertPerson(row)) }
}
