import type { PersonRole } from '../../shared/types/person-role'
import type { RoleName } from '../../shared/types/role'
import {
  DELETE_PERSON_ROLE,
  FIND_PERSON_ROLE,
  INSERT_PERSON_ROLE,
} from '../queries/person-role'
import { query, type PostgresQuery } from '../pool'
import { requireRow } from './require-row'

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
): Promise<PersonRole> {
  const result = await run(INSERT_PERSON_ROLE, [
    personRole.person_id,
    personRole.role,
  ])
  return requireRow<PersonRole>(result, 'person_role', 'not_created')
}

export async function removePersonRoleRow(
  personId: string,
  role: RoleName,
  run: PostgresQuery = query,
): Promise<PersonRole> {
  const result = await run(DELETE_PERSON_ROLE, [personId, role])
  return requireRow<PersonRole>(result, 'person_role', 'missing')
}
