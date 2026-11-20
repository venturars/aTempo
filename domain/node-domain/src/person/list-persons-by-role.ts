import { PERSON_COLUMNS_FROM_PERSON } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertPerson, type Person } from '../types/person'
import { assertRoleName } from '../types/role'

const SELECT = `SELECT
  ${PERSON_COLUMNS_FROM_PERSON}
FROM person
INNER JOIN person_role ON person_role.person_id = person.id
WHERE person_role.role = $1`

export async function listPersonsByRole(roleName: string): Promise<Person[]> {
  assertRoleName(roleName)

  const result = await query<Person>(SELECT, [roleName])
  return result.rows.map((row) => assertPerson(row))
}
