import { query } from '../postgres/db'
import { assertPerson, type Person } from '../types/person'

const UPDATE = `UPDATE person
SET
  identification_document = $2,
  email = $3,
  first_name = $4,
  last_name = $5,
  birth_date = $6,
  phone = $7
WHERE id = $1::uuid
RETURNING
  id::text AS id,
  identification_document,
  email,
  first_name,
  last_name,
  birth_date::text AS birth_date,
  phone`

export async function updatePerson(input: unknown): Promise<Person | null> {
  assertPerson(input)

  const result = await query<Person>(UPDATE, [
    input.id,
    input.identification_document,
    input.email,
    input.first_name,
    input.last_name,
    input.birth_date,
    input.phone,
  ])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertPerson(row)
  return row
}
