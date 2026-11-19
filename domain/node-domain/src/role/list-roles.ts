import { query } from '../postgres/db'
import { assertRole, type Role } from '../types/role'

const SELECT = `SELECT name FROM role`

export async function listRoles(): Promise<Role[]> {
  const result = await query<Role>(SELECT)
  return result.rows.map((row) => {
    assertRole(row)
    return row
  })
}
