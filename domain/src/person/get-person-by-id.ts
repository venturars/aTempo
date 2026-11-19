import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  id::text AS id,
  identification_document,
  email,
  first_name,
  last_name,
  birth_date::text AS birth_date,
  phone
FROM person
WHERE id = $1::uuid`

export async function getPersonById(id: string): Promise<Person | null> {
  assertUuid(id, 'person.id')

  const result = await query<Person>(SELECT, [id])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertPerson(row)
  return row
}
