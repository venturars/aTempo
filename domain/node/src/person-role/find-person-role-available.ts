import { fail } from '../shared/errors'
import { personRoleExists } from '../postgres/executors/person-role'
import { query, type PostgresQuery } from '../postgres/pool'
import type { RoleName } from '../shared/types/role'

export type FindPersonRoleAvailableInput = {
  personId: string
  role: RoleName
}

export async function findPersonRoleAvailable(
  input: FindPersonRoleAvailableInput,
  run: PostgresQuery = query,
): Promise<void> {
  const exists = await personRoleExists(input.personId, input.role, run)
  if (exists) {
    fail('person_role', 'taken')
  }
}
