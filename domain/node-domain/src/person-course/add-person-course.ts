import { withTransaction } from '../postgres/db'
import {
  assertPersonCourse,
  type PersonCourse,
} from '../types/person-course'

const LOOKUP = `SELECT
  EXISTS (SELECT 1 FROM person WHERE id = $1::uuid) AS person_exists,
  EXISTS (SELECT 1 FROM course WHERE id = $2::uuid) AS course_exists,
  EXISTS (
    SELECT 1 FROM person_course
    WHERE person_id = $1::uuid AND course_id = $2::uuid
  ) AS already`

const INSERT = `INSERT INTO person_course (person_id, course_id)
VALUES ($1::uuid, $2::uuid)
RETURNING person_id::text AS person_id, course_id::text AS course_id`

type EnrollmentLookup = {
  person_exists: boolean
  course_exists: boolean
  already: boolean
}

export async function addPersonCourse(input: unknown): Promise<PersonCourse> {
  const body = assertPersonCourse(input)

  return withTransaction(async (query) => {
    const lookup = await query(LOOKUP, [body.person_id, body.course_id])
    const flags = lookup.rows[0] as EnrollmentLookup | undefined
    if (!flags?.person_exists) {
      throw new Error('person no existe')
    }
    if (!flags.course_exists) {
      throw new Error('course no existe')
    }
    if (flags.already) {
      throw new Error('person_course ya existe')
    }

    const result = await query(INSERT, [body.person_id, body.course_id])
    const row = result.rows[0]
    if (!row) {
      throw new Error('person_course no se ha creado')
    }

    return assertPersonCourse(row)
  })
}
