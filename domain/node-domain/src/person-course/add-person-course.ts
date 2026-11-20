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
  const body = assertPersonCourse(input)
  await assertPersonExists(body.person_id)
  await assertCourseExists(body.course_id)
  await assertPersonCourseAvailable(body.person_id, body.course_id)

  const result = await query<PersonCourse>(INSERT, [
    body.person_id,
    body.course_id,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('person_course no se ha creado')
  }

  return assertPersonCourse(row)
}
