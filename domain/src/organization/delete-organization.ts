import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE = `DELETE FROM organization WHERE id = $1::uuid`

export async function deleteOrganization(id: string): Promise<boolean> {
  assertUuid(id, 'organization.id')

  const result = await query(DELETE, [id])
  return (result.rowCount ?? 0) > 0
}
