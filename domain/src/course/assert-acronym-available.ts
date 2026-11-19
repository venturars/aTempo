import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  ${COURSE_COLUMNS}
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
