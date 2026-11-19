import { query } from '../postgres/db'
import {
  assertPersonCourse,
  type PersonCourse,
} from '../types/person-course'

const SELECT = `SELECT
  person_id::text AS person_id,
  course_id::text AS course_id
FROM person_course`

export async function listPersonCourses(): Promise<PersonCourse[]> {
  const result = await query<PersonCourse>(SELECT)
  return result.rows.map((row) => {
    assertPersonCourse(row)
    return row
  })
}
