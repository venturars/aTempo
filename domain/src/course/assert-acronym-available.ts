import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address
FROM course
WHERE organization_id = $1::uuid AND acronym = $2`

export async function assertAcronymAvailable(
  organizationId: string,
  acronym: string,
  ignoreId?: string,
): Promise<void> {
  assertUuid(organizationId, 'course.organization_id')

  const result = await query<Course>(SELECT, [organizationId, acronym])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertCourse(row)
  if (row.id !== ignoreId) {
    throw new Error('course.acronym ya existe en la organización')
  }
}
