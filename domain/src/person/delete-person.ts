import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'

const DELETE = `DELETE FROM person WHERE id = $1::uuid`

export async function deletePerson(id: string): Promise<boolean> {
  assertUuid(id, 'person.id')

  const result = await query(DELETE, [id])
  return (result.rowCount ?? 0) > 0
}
