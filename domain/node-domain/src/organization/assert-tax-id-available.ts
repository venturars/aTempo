import { ORGANIZATION_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertNonEmptyString } from '../types/assert'
import { assertOrganization, type Organization } from '../types/organization'

const SELECT = `SELECT
  ${ORGANIZATION_COLUMNS}
FROM organization
WHERE tax_id = $1`

export async function assertTaxIdAvailable(
  taxId: string,
  ignoreId?: string,
): Promise<void> {
  assertNonEmptyString(taxId, 'organization.tax_id')

  const result = await query<Organization>(SELECT, [taxId])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertOrganization(row)
  if (row.id !== ignoreId) {
    throw new Error('organization.tax_id ya existe')
  }
}
