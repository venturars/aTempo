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
WHERE identification_document = $1`

export async function assertIdentificationDocumentAvailable(
  identificationDocument: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(
    identificationDocument,
    'person.identification_document',
  )

  const result = await query<Person>(SELECT, [identificationDocument])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertPerson(row)
  if (row.id !== ignoreId) {
    throw new Error('person.identification_document ya existe')
  }
}
