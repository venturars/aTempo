import { ORGANIZATION_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertOrganization, type Organization } from '../types/organization'
import { assertTaxIdAvailable } from './assert-tax-id-available'

const UPDATE = `UPDATE organization
SET name = $2, tax_id = $3
WHERE id = $1::uuid
RETURNING
  ${ORGANIZATION_COLUMNS}`

export async function updateOrganization(
  input: unknown,
): Promise<Organization | null> {
  assertOrganization(input)
  await assertTaxIdAvailable(input.tax_id, input.id)

  const result = await query<Organization>(UPDATE, [
    input.id,
    input.name,
    input.tax_id,
  ])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertOrganization(row)
  return row
}
