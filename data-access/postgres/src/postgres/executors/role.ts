import type { Role } from '../../shared/types/role'
import { LIST_ROLES, LIST_ROLES_BY_PERSON } from '../queries/role'
import { query, type PostgresQuery } from '../pool'

export async function retrieveAllRoleRows(
  run: PostgresQuery = query,
): Promise<Role[]> {
  const result = await run(LIST_ROLES)
  return result.rows as Role[]
}

export async function retrieveAllRolesByPersonId(
  personId: string,
  run: PostgresQuery = query,
): Promise<Role[]> {
  const result = await run(LIST_ROLES_BY_PERSON, [personId])
  return result.rows as Role[]
}
