import { assertPersonExists } from '../person/assert-person-exists'
import { query } from '../postgres/db'
import { assertPersonRole, type PersonRole } from '../types/person-role'
import { assertPersonRoleAvailable } from './assert-person-role-available'
import { assertStudentExclusive } from './assert-student-exclusive'

const INSERT = `INSERT INTO person_role (person_id, role)
VALUES ($1::uuid, $2)
RETURNING person_id::text AS person_id, role`

export async function addPersonRole(input: unknown): Promise<PersonRole> {
  const body = assertPersonRole(input)
  await assertPersonExists(body.person_id)
  await assertStudentExclusive(body.person_id, body.role)
  await assertPersonRoleAvailable(body.person_id, body.role)

  const result = await query<PersonRole>(INSERT, [body.person_id, body.role])
  const row = result.rows[0]
  if (!row) {
    throw new Error('person_role no se ha creado')
  }

  return assertPersonRole(row)
}
