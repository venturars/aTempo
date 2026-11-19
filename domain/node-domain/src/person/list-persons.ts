import { PERSON_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertPerson, type Person } from '../types/person'

const SELECT = `SELECT
  ${PERSON_COLUMNS}
FROM person`

export async function listPersons(): Promise<Person[]> {
  const result = await query<Person>(SELECT)
  return result.rows.map((row) => {
    assertPerson(row)
    return row
  })
}
