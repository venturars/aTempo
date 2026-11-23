import { deletePersonRole } from '../postgres/repositories/person-role'
import { assertUuid } from '../types/assert'
import { assertRoleName, type RoleName } from '../types/role'

export type RemovePersonRoleInput = {
  personId: string
  roleName: RoleName
}

export type RemovePersonRoleOutput = {
  deleted: boolean
}

export async function removePersonRole(
  input: RemovePersonRoleInput,
): Promise<RemovePersonRoleOutput> {
  const personId = assertUuid(input.personId, 'person_role.person_id')
  const roleName = assertRoleName(input.roleName, 'person_role.role')
  const deleted = await deletePersonRole(personId, roleName)
  return { deleted }
}
