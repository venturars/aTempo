import { query } from '../postgres/db'
import { assertPersonRole, type PersonRole } from '../types/person-role'

const INSERT = `INSERT INTO person_role (person_id, role)
VALUES ($1::uuid, $2)
RETURNING person_id::text AS person_id, role`

export async function addPersonRole(input: unknown): Promise<PersonRole> {
  assertPersonRole(input)

  const result = await query<PersonRole>(INSERT, [input.person_id, input.role])
  const row = result.rows[0]
  if (!row) {
    throw new Error('person_role no se ha creado')
  }

  assertPersonRole(row)
  return row
}
