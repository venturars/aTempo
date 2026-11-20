import { query } from '../postgres/db'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'
import { normalizeEmail } from '../types/person'

const SELECT = `SELECT id::text AS id
FROM person
WHERE lower(email) = $1`

export async function assertEmailAvailable(
  email: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(email, 'person.email')
  const wanted = normalizeEmail(email)

  const result = await query<{ id: string }>(SELECT, [wanted])
  const row = result.rows[0]
  if (!row) {
    return
  }

  if (ignoreId === undefined || normalizeUuid(row.id) !== normalizeUuid(ignoreId)) {
    throw new Error('person.email ya existe')
  }
}
