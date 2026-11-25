import { findRoleByName } from '../postgres/executors/role'
import { assertRole, assertRoleName, type Role, type RoleName } from '../types/role'

export type RetrieveRoleByNameInput = {
  name: RoleName
}

export type RetrieveRoleByNameOutput = {
  role: Role | null
}

export async function retrieveRoleByName(
  input: RetrieveRoleByNameInput,
): Promise<RetrieveRoleByNameOutput> {
  const name = assertRoleName(input.name)
  const row = await findRoleByName(name)
  if (!row) {
    return { role: null }
  }

  return { role: assertRole(row) }
}
