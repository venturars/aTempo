import { retrieveAllPersonsByRoleName } from '../postgres/executors/person'
import { personFromRow } from '../postgres/rows/person'
import type { Person } from '../shared/types/person'
import { assertRoleName } from '../shared/validation/role'
import type { RoleName } from '../shared/types/role'

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
  return { persons: rows.map((row) => personFromRow(row)) }
}
