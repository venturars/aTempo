import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE_ROLES = `DELETE FROM person_role WHERE person_id = $1::uuid`
const DELETE_COURSES = `DELETE FROM person_course WHERE person_id = $1::uuid`
const DELETE_PERSON = `DELETE FROM person WHERE id = $1::uuid`

export async function deletePerson(id: string): Promise<boolean> {
  assertUuid(id, 'person.id')

  await query(DELETE_ROLES, [id])
  await query(DELETE_COURSES, [id])
  const result = await query(DELETE_PERSON, [id])
  return (result.rowCount ?? 0) > 0
}
