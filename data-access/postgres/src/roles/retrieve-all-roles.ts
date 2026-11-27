import { retrieveAllRoleRows } from '../postgres/executors/role'
import { assertRole } from '../shared/validation/role'
import type { Role } from '../shared/types/role'

export type RetrieveAllRolesOutput = {
  roles: Role[]
}

export async function retrieveAllRoles(): Promise<RetrieveAllRolesOutput> {
  const rows = await retrieveAllRoleRows()
  return { roles: rows.map((row) => assertRole(row)) }
}
