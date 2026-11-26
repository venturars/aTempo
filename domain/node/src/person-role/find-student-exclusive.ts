import { fail } from '../shared/errors'
import { query, type PostgresQuery } from '../postgres/pool'
import { retrieveAllRolesByPersonId } from '../postgres/executors/role'
import type { RoleName } from '../shared/types/role'

export type FindStudentExclusiveInput = {
  personId: string
  role: RoleName
}

export async function findStudentExclusive(
  input: FindStudentExclusiveInput,
  run: PostgresQuery = query,
): Promise<void> {
  const roles = await retrieveAllRolesByPersonId(input.personId, run)
  const names = roles.map((role) => role.name)

  if (input.role === 'student' && names.some((name) => name !== 'student')) {
    fail('person_role.student', 'exclusive')
  }

  if (input.role !== 'student' && names.includes('student')) {
    fail('person_role.student', 'exclusive')
  }
}
