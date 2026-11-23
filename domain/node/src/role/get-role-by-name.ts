import { findRoleByName } from '../postgres/repositories/role'
import { assertRole, assertRoleName, type Role, type RoleName } from '../types/role'

export type GetRoleByNameInput = {
  name: RoleName
}

export type GetRoleByNameOutput = {
  role: Role | null
}

export async function getRoleByName(
  input: GetRoleByNameInput,
): Promise<GetRoleByNameOutput> {
  const name = assertRoleName(input.name)
  const row = await findRoleByName(name)
  if (!row) {
    return { role: null }
  }

  return { role: assertRole(row) }
}
