import { query } from '../postgres/db'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  id::text AS id,
  identification_document,
  email,
  first_name,
  last_name,
  birth_date::text AS birth_date,
  phone
FROM person`

export async function listPersons(): Promise<Person[]> {
  const result = await query<Person>(SELECT)
  return result.rows.map((row) => {
    assertPerson(row)
    return row
  })
}
