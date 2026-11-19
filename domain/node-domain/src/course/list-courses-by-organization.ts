import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  ${COURSE_COLUMNS}
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
