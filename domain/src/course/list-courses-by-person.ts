import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  course.id::text AS id,
  course.organization_id::text AS organization_id,
  course.name,
  course.acronym,
  course.start_at::text AS start_at,
  course.end_at::text AS end_at,
  course.contract_address
FROM course
INNER JOIN person_course ON person_course.course_id = course.id
WHERE person_course.person_id = $1::uuid`

export async function listCoursesByPerson(
  personId: string,
): Promise<Course[]> {
  assertUuid(personId, 'person.id')

  const result = await query<Course>(SELECT, [personId])
  return result.rows.map((row) => {
    assertCourse(row)
    return row
  })
}
