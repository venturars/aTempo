import { fail } from '../errors'
import { listRolesByPersonId } from '../postgres/executors/role'
import type { RoleName } from '../types/role'

export type AssertStudentExclusiveInput = {
  personId: string
  role: RoleName
}

export async function assertStudentExclusive(
  input: AssertStudentExclusiveInput,
): Promise<void> {
  const roles = await listRolesByPersonId(input.personId)
  const names = roles.map((role) => role.name)

  if (input.role === 'student' && names.some((name) => name !== 'student')) {
    fail('person_role.student', 'exclusive')
  }

  if (input.role !== 'student' && names.includes('student')) {
    fail('person_role.student', 'exclusive')
  }
}
