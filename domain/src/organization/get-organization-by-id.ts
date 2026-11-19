import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertOrganization, type Organization } from '../types/organization'

const SELECT = `SELECT id::text AS id, name, tax_id FROM organization WHERE id = $1::uuid`

export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  assertUuid(id, 'organization.id')

  const result = await query<Organization>(SELECT, [id])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertOrganization(row)
  return row
}
