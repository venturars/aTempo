import { query } from '../postgres/db'
import type { RoleName } from '../types/role'

const SELECT = `SELECT 1
FROM person_role
WHERE person_id = $1::uuid AND role = $2`

export async function assertPersonRoleAvailable(
  personId: string,
  role: RoleName,
): Promise<void> {
  const result = await query(SELECT, [personId, role])
  if (result.rows[0]) {
    throw new Error('person_role ya existe')
  }
}
