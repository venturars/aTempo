import { withTransaction } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE_ENROLLMENTS = `DELETE FROM person_course WHERE course_id = $1::uuid`
const DELETE_COURSE = `DELETE FROM course WHERE id = $1::uuid`

export async function deleteCourse(id: string): Promise<boolean> {
  assertUuid(id, 'course.id')

  return withTransaction(async (query) => {
    await query(DELETE_ENROLLMENTS, [id])
    const result = await query(DELETE_COURSE, [id])
    return (result.rowCount ?? 0) > 0
  })
}
