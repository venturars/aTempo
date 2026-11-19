import { query } from '../postgres/db'
import { assertOrganization, type Organization } from '../types/organization'

const UPDATE = `UPDATE organization
SET name = $2, tax_id = $3
WHERE id = $1::uuid
RETURNING id::text AS id, name, tax_id`

export async function updateOrganization(
  input: unknown,
): Promise<Organization | null> {
  assertOrganization(input)

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
