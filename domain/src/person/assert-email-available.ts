import { query } from '../postgres/db'
import { assertNonEmptyString } from '../types/assert'
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
WHERE email = $1`

export async function assertEmailAvailable(
  email: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(email, 'person.email')

  const result = await query<Person>(SELECT, [email])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertPerson(row)
  if (row.id !== ignoreId) {
    throw new Error('person.email ya existe')
  }
}
