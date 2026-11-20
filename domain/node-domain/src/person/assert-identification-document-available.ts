import { query } from '../postgres/db'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'

const SELECT = `SELECT id::text AS id
FROM person
WHERE lower(identification_document) = $1`

export async function assertIdentificationDocumentAvailable(
  identificationDocument: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(
    identificationDocument,
    'person.identification_document',
  )

  const result = await query<{ id: string }>(SELECT, [
    identificationDocument.toLowerCase(),
  ])
  const row = result.rows[0]
  if (!row) {
    return
  }

  if (ignoreId === undefined || normalizeUuid(row.id) !== normalizeUuid(ignoreId)) {
    throw new Error('person.identification_document ya existe')
  }
}
