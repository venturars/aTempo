import { query } from '../postgres/db'
import { assertCourse, assertCourseInput, type Course } from '../types/course'

const INSERT = `INSERT INTO course (
  organization_id,
  name,
  acronym,
  start_at,
  end_at,
  contract_address
) VALUES ($1::uuid, $2, $3, $4, $5, $6)
RETURNING
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address`

export async function createCourse(input: unknown): Promise<Course> {
  assertCourseInput(input)

  const result = await query<Course>(INSERT, [
    input.organization_id,
    input.name,
    input.acronym,
    input.start_at,
    input.end_at,
    input.contract_address,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('course no se ha creado')
  }

  assertCourse(row)
  return row
}
