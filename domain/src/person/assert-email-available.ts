import { PERSON_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertNonEmptyString } from '../types/assert'
import {
  assertPerson,
  normalizeEmail,
  type Person,
} from '../types/person'

const SELECT = `SELECT
  ${PERSON_COLUMNS}
FROM person
WHERE lower(email) = $1`

export async function assertEmailAvailable(
  email: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(email, 'person.email')
  const wanted = normalizeEmail(email)

  const result = await query<Person>(SELECT, [wanted])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertPerson(row)
  if (row.id !== ignoreId) {
    throw new Error('person.email ya existe')
  }
}
