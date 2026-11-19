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
WHERE organization_id = $1::uuid`

export async function listCoursesByOrganization(
  organizationId: string,
): Promise<Course[]> {
  assertUuid(organizationId, 'organization.id')

  const result = await query<Course>(SELECT, [organizationId])
  return result.rows.map((row) => {
    assertCourse(row)
    return row
  })
}
