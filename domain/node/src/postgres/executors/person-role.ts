import type { PersonRole } from '../../shared/types/person-role'
import type { RoleName } from '../../shared/types/role'
import {
  DELETE_PERSON_ROLE,
  FIND_PERSON_ROLE,
  INSERT_PERSON_ROLE,
  LIST_PERSON_ROLES,
} from '../queries/person-role'
import { query, type PostgresQuery } from '../pool'

export async function retrieveAllPersonRoleRows(
  run: PostgresQuery = query,
): Promise<PersonRole[]> {
  const result = await run(LIST_PERSON_ROLES)
  return result.rows as PersonRole[]
}

export async function personRoleExists(
  personId: string,
  role: RoleName,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(FIND_PERSON_ROLE, [personId, role])
  return Boolean(result.rows[0])
}

export async function addPersonRoleRow(
  personRole: PersonRole,
  run: PostgresQuery = query,
): Promise<PersonRole | null> {
  const result = await run(INSERT_PERSON_ROLE, [
    personRole.person_id,
    personRole.role,
  ])
  return (result.rows[0] as PersonRole | undefined) ?? null
}

export async function deregisterPersonRoleRow(
  personId: string,
  role: RoleName,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(DELETE_PERSON_ROLE, [personId, role])
  return (result.rowCount ?? 0) > 0
}
