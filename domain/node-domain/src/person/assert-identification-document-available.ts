import { PERSON_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertNonEmptyString } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  ${PERSON_COLUMNS}
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
