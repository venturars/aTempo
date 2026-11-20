import { ORGANIZATION_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertOrganization, type Organization } from '../types/organization'

const SELECT = `SELECT
  ${ORGANIZATION_COLUMNS}
FROM organization`

export async function listOrganizations(): Promise<Organization[]> {
  const result = await query<Organization>(SELECT)
  return result.rows.map((row) => assertOrganization(row))
}
