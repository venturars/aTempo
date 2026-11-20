import { query } from '../postgres/db'
import { assertUuid, normalizeUuid } from '../types/assert'

const SELECT = `SELECT id::text AS id
FROM course
WHERE organization_id = $1::uuid AND acronym = $2`

export async function assertAcronymAvailable(
  organizationId: string,
  acronym: string,
  ignoreId?: string,
): Promise<void> {
  assertUuid(organizationId, 'course.organization_id')

  const result = await query<{ id: string }>(SELECT, [organizationId, acronym])
  const row = result.rows[0]
  if (!row) {
    return
  }

  if (ignoreId === undefined || normalizeUuid(row.id) !== normalizeUuid(ignoreId)) {
    throw new Error('course.acronym ya existe en la organización')
  }
}
