import { listRoles as listRoleRows } from '../postgres/repositories/role'
import { assertRole, type Role } from '../types/role'

export type ListRolesOutput = {
  roles: Role[]
}

export async function listRoles(): Promise<ListRolesOutput> {
  const rows = await listRoleRows()
  return { roles: rows.map((row) => assertRole(row)) }
}
