import { COURSE_COLUMNS_FROM_COURSE } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  ${COURSE_COLUMNS_FROM_COURSE}
FROM course
INNER JOIN person_course ON person_course.course_id = course.id
WHERE person_course.person_id = $1::uuid`

export async function listCoursesByPerson(
  personId: string,
): Promise<Course[]> {
  assertUuid(personId, 'person.id')

  const result = await query<Course>(SELECT, [personId])
  return result.rows.map((row) => assertCourse(row))
}
