import { ConflictError } from '../errors'
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
    throw new ConflictError('un student no puede llevar otro rol', {
      entity: 'person_role',
      field: 'role',
    })
  }

  if (input.role !== 'student' && names.includes('student')) {
    throw new ConflictError('un student no puede llevar otro rol', {
      entity: 'person_role',
      field: 'role',
    })
  }
}
