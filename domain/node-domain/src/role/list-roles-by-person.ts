import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertRole, type Role } from '../types/role'

const SELECT = `SELECT role.name
FROM role
INNER JOIN person_role ON person_role.role = role.name
WHERE person_role.person_id = $1::uuid`

export async function listRolesByPerson(personId: string): Promise<Role[]> {
  assertUuid(personId, 'person.id')

  const result = await query<Role>(SELECT, [personId])
  return result.rows.map((row) => {
    assertRole(row)
    return row
  })
}
