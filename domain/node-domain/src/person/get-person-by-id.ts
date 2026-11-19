import { PERSON_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertUuid } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  ${PERSON_COLUMNS}
FROM person
WHERE id = $1::uuid`

export async function getPersonById(id: string): Promise<Person | null> {
  assertUuid(id, 'person.id')

  const result = await query<Person>(SELECT, [id])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertPerson(row)
  return row
}
