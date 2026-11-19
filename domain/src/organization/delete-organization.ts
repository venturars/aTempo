import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE_ENROLLMENTS = `DELETE FROM person_course
WHERE course_id IN (SELECT id FROM course WHERE organization_id = $1::uuid)`
const DELETE_COURSES = `DELETE FROM course WHERE organization_id = $1::uuid`
const DELETE_ORGANIZATION = `DELETE FROM organization WHERE id = $1::uuid`

export async function deleteOrganization(id: string): Promise<boolean> {
  assertUuid(id, 'organization.id')

  await query(DELETE_ENROLLMENTS, [id])
  await query(DELETE_COURSES, [id])
  const result = await query(DELETE_ORGANIZATION, [id])
  return (result.rowCount ?? 0) > 0
}
