import { retrieveAllRoles as retrieveAllRoleRows } from '../postgres/executors/role'
import { assertRole, type Role } from '../types/role'

export type RetrieveAllRolesOutput = {
  roles: Role[]
}

export async function retrieveAllRoles(): Promise<RetrieveAllRolesOutput> {
  const rows = await retrieveAllRoleRows()
  return { roles: rows.map((row) => assertRole(row)) }
}
