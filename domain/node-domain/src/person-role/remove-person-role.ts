import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertRoleName } from '../types/role'

const DELETE = `DELETE FROM person_role
WHERE person_id = $1::uuid AND role = $2`

export async function removePersonRole(
  personId: string,
  roleName: string,
): Promise<boolean> {
  assertUuid(personId, 'person_role.person_id')
  assertRoleName(roleName, 'person_role.role')

  const result = await query(DELETE, [personId, roleName])
  return (result.rowCount ?? 0) > 0
}
