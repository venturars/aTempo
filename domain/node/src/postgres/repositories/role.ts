import type { Role, RoleName } from '../../types/role'
import {
  GET_ROLE_BY_NAME,
  LIST_ROLES,
  LIST_ROLES_BY_PERSON,
} from '../queries/role'
import { query, type PostgresQuery } from '../pool'

export async function listRoles(run: PostgresQuery = query): Promise<Role[]> {
  const result = await run(LIST_ROLES)
  return result.rows as Role[]
}

export async function findRoleByName(
  name: RoleName,
  run: PostgresQuery = query,
): Promise<Role | null> {
  const result = await run(GET_ROLE_BY_NAME, [name])
  return (result.rows[0] as Role | undefined) ?? null
}

export async function listRolesByPersonId(
  personId: string,
  run: PostgresQuery = query,
): Promise<Role[]> {
  const result = await run(LIST_ROLES_BY_PERSON, [personId])
  return result.rows as Role[]
}
