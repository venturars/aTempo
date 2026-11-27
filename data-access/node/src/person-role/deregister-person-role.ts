import { deregisterPersonRoleRow } from '../postgres/executors/person-role'
import { assertUuid } from '../shared/validation/assert'
import { assertRoleName } from '../shared/validation/role'
import type { RoleName } from '../shared/types/role'

export type DeregisterPersonRoleInput = {
  personId: string
  roleName: RoleName
}

export type DeregisterPersonRoleOutput = {
  deleted: boolean
}

export async function deregisterPersonRole(
  input: DeregisterPersonRoleInput,
): Promise<DeregisterPersonRoleOutput> {
  const personId = assertUuid(input.personId, 'person_role.person_id')
  const roleName = assertRoleName(input.roleName, 'person_role.role')
  const deleted = await deregisterPersonRoleRow(personId, roleName)
  return { deleted }
}
