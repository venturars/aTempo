import { query } from '../postgres/db'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'

const SELECT = `SELECT id::text AS id
FROM organization
WHERE tax_id = $1`

export async function assertTaxIdAvailable(
  taxId: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(taxId, 'organization.tax_id')

  const result = await query<{ id: string }>(SELECT, [taxId])
  const row = result.rows[0]
  if (!row) {
    return
  }

  if (ignoreId === undefined || normalizeUuid(row.id) !== normalizeUuid(ignoreId)) {
    throw new Error('organization.tax_id ya existe')
  }
}
