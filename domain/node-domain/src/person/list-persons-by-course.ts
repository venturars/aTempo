import { PERSON_COLUMNS_FROM_PERSON } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  ${PERSON_COLUMNS_FROM_PERSON}
FROM person
INNER JOIN person_course ON person_course.person_id = person.id
WHERE person_course.course_id = $1::uuid`

export async function listPersonsByCourse(
  courseId: string,
): Promise<Person[]> {
  assertUuid(courseId, 'course.id')

  const result = await query<Person>(SELECT, [courseId])
  return result.rows.map((row) => assertPerson(row))
}
