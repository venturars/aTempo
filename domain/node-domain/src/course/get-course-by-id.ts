import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  ${COURSE_COLUMNS}
FROM course
WHERE id = $1::uuid`

export async function getCourseById(id: string): Promise<Course | null> {
  assertUuid(id, 'course.id')

  const result = await query<Course>(SELECT, [id])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  return assertCourse(row)
}
