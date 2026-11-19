import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address
FROM course
WHERE id = $1::uuid`

export async function getCourseById(id: string): Promise<Course | null> {
  assertUuid(id, 'course.id')

  const result = await query<Course>(SELECT, [id])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertCourse(row)
  return row
}
