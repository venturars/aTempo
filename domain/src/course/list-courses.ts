import { query } from '../postgres/db'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address
FROM course`

export async function listCourses(): Promise<Course[]> {
  const result = await query<Course>(SELECT)
  return result.rows.map((row) => {
    assertCourse(row)
    return row
  })
}
