import { fail } from '../errors'
import { retrieveAllRolesByPersonId } from '../postgres/executors/role'
import type { RoleName } from '../types/role'

export type FindStudentExclusiveInput = {
  personId: string
  role: RoleName
}

export async function findStudentExclusive(
  input: FindStudentExclusiveInput,
): Promise<void> {
  const roles = await retrieveAllRolesByPersonId(input.personId)
  const names = roles.map((role) => role.name)

  if (input.role === 'student' && names.some((name) => name !== 'student')) {
    fail('person_role.student', 'exclusive')
  }

  if (input.role !== 'student' && names.includes('student')) {
    fail('person_role.student', 'exclusive')
  }
}
