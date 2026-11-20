import { query } from '../postgres/db'
import { assertRole, assertRoleName, type Role } from '../types/role'

const SELECT = `SELECT name FROM role WHERE name = $1`

export async function getRoleByName(name: string): Promise<Role | null> {
  assertRoleName(name)

  const result = await query<Role>(SELECT, [name])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertRole(row)
  return row
}
