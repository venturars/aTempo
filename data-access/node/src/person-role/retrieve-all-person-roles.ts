import { retrieveAllPersonRoleRows } from '../postgres/executors/person-role'
import { assertPersonRole } from '../shared/validation/person-role'
import type { PersonRole } from '../shared/types/person-role'

export type RetrieveAllPersonRolesOutput = {
  personRoles: PersonRole[]
}

export async function retrieveAllPersonRoles(): Promise<RetrieveAllPersonRolesOutput> {
  const rows = await retrieveAllPersonRoleRows()
  return { personRoles: rows.map((row) => assertPersonRole(row)) }
}
