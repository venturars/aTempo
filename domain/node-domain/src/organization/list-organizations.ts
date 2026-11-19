import { query } from '../postgres/db'
import { assertOrganization, type Organization } from '../types/organization'

const SELECT = `SELECT id::text AS id, name, tax_id FROM organization`

export async function listOrganizations(): Promise<Organization[]> {
  const result = await query<Organization>(SELECT)
  return result.rows.map((row) => {
    assertOrganization(row)
    return row
  })
}
