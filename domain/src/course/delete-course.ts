import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE = `DELETE FROM course WHERE id = $1::uuid`

export async function deleteCourse(id: string): Promise<boolean> {
  assertUuid(id, 'course.id')

  const result = await query(DELETE, [id])
  return (result.rowCount ?? 0) > 0
}
