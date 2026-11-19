import { query } from '../postgres/db'
import { assertPerson, type Person } from '../types/person'
import { assertRoleName } from '../types/role'

const SELECT = `SELECT
  person.id::text AS id,
  person.identification_document,
  person.email,
  person.first_name,
  person.last_name,
  person.birth_date::text AS birth_date,
  person.phone
FROM person
INNER JOIN person_role ON person_role.person_id = person.id
WHERE person_role.role = $1`

export async function listPersonsByRole(roleName: string): Promise<Person[]> {
  assertRoleName(roleName)

  const result = await query<Person>(SELECT, [roleName])
  return result.rows.map((row) => {
    assertPerson(row)
    return row
  })
}
