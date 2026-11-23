import { listPersonRoles as listPersonRoleRows } from '../postgres/repositories/person-role'
import { assertPersonRole, type PersonRole } from '../types/person-role'

export type ListPersonRolesOutput = {
  personRoles: PersonRole[]
}

export async function listPersonRoles(): Promise<ListPersonRolesOutput> {
  const rows = await listPersonRoleRows()
  return { personRoles: rows.map((row) => assertPersonRole(row)) }
}
