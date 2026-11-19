import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  person.id::text AS id,
  person.identification_document,
  person.email,
  person.first_name,
  person.last_name,
  person.birth_date::text AS birth_date,
  person.phone
FROM person
INNER JOIN person_course ON person_course.person_id = person.id
WHERE person_course.course_id = $1::uuid`

export async function listPersonsByCourse(
  courseId: string,
): Promise<Person[]> {
  assertUuid(courseId, 'course.id')

  const result = await query<Person>(SELECT, [courseId])
  return result.rows.map((row) => {
    assertPerson(row)
    return row
  })
}
