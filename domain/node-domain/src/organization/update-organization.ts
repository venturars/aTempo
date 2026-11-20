import { ORGANIZATION_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import {
  assertOrganization,
  assertOrganizationUpdate,
  type Organization,
} from '../types/organization'
import { assertTaxIdAvailable } from './assert-tax-id-available'

const UPDATE = `UPDATE organization
SET name = $2, tax_id = $3
WHERE id = $1::uuid
RETURNING
  ${ORGANIZATION_COLUMNS}`

export async function updateOrganization(
  input: unknown,
): Promise<Organization | null> {
  const organization = assertOrganizationUpdate(input)
  await assertTaxIdAvailable(organization.tax_id, organization.id)

  const result = await query<Organization>(UPDATE, [
    organization.id,
    organization.name,
    organization.tax_id,
  ])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  return assertOrganization(row)
}
