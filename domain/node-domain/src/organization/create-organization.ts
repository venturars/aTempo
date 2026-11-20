import { ORGANIZATION_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import {
  assertOrganization,
  assertOrganizationInput,
  type Organization,
} from '../types/organization'
import { assertTaxIdAvailable } from './assert-tax-id-available'

const INSERT = `INSERT INTO organization (name, tax_id)
VALUES ($1, $2)
RETURNING
  ${ORGANIZATION_COLUMNS}`

export async function createOrganization(
  input: unknown,
): Promise<Organization> {
  const body = assertOrganizationInput(input)
  await assertTaxIdAvailable(body.tax_id)

  const result = await query<Organization>(INSERT, [body.name, body.tax_id])
  const row = result.rows[0]
  if (!row) {
    throw new Error('organization no se ha creado')
  }

  return assertOrganization(row)
}
