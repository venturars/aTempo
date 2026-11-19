import { query } from '../postgres/db'
import {
  assertOrganization,
  assertOrganizationInput,
  type Organization,
} from '../types/organization'
import { assertTaxIdAvailable } from './assert-tax-id-available'

const INSERT = `INSERT INTO organization (name, tax_id)
VALUES ($1, $2)
RETURNING id::text AS id, name, tax_id`

export async function createOrganization(
  input: unknown,
): Promise<Organization> {
  assertOrganizationInput(input)
  await assertTaxIdAvailable(input.tax_id)

  const result = await query<Organization>(INSERT, [input.name, input.tax_id])
  const row = result.rows[0]
  if (!row) {
    throw new Error('organization no se ha creado')
  }

  assertOrganization(row)
  return row
}
