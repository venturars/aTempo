import { assertCourseExists } from '../course/assert-course-exists'
import { assertPersonExists } from '../person/assert-person-exists'
import { query } from '../postgres/db'
import {
  assertPersonCourse,
  type PersonCourse,
} from '../types/person-course'
import { assertPersonCourseAvailable } from './assert-person-course-available'

const INSERT = `INSERT INTO person_course (person_id, course_id)
VALUES ($1::uuid, $2::uuid)
RETURNING person_id::text AS person_id, course_id::text AS course_id`

export async function addPersonCourse(input: unknown): Promise<PersonCourse> {
  assertPersonCourse(input)
  await assertPersonExists(input.person_id)
  await assertCourseExists(input.course_id)
  await assertPersonCourseAvailable(input.person_id, input.course_id)

  const result = await query<PersonCourse>(INSERT, [
    input.person_id,
    input.course_id,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('person_course no se ha creado')
  }

  assertPersonCourse(row)
  return row
}
