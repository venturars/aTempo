import { retrieveAllPersonRoles as retrieveAllPersonRoleRows } from '../postgres/executors/person-role'
import { assertPersonRole, type PersonRole } from '../types/person-role'

export type RetrieveAllPersonRolesOutput = {
  personRoles: PersonRole[]
}

export async function retrieveAllPersonRoles(): Promise<RetrieveAllPersonRolesOutput> {
  const rows = await retrieveAllPersonRoleRows()
  return { personRoles: rows.map((row) => assertPersonRole(row)) }
}
