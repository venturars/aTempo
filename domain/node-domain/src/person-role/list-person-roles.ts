import { query } from '../postgres/db'
import { assertPersonRole, type PersonRole } from '../types/person-role'

const SELECT = `SELECT
  person_id::text AS person_id,
  role
FROM person_role`

export async function listPersonRoles(): Promise<PersonRole[]> {
  const result = await query<PersonRole>(SELECT)
  return result.rows.map((row) => {
    assertPersonRole(row)
    return row
  })
}
