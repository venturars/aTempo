import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE = `DELETE FROM person_course
WHERE person_id = $1::uuid AND course_id = $2::uuid`

export async function removePersonCourse(
  personId: string,
  courseId: string,
): Promise<boolean> {
  assertUuid(personId, 'person_course.person_id')
  assertUuid(courseId, 'person_course.course_id')

  const result = await query(DELETE, [personId, courseId])
  return (result.rowCount ?? 0) > 0
}
