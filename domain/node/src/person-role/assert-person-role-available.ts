import { ConflictError } from '../errors'
import { personRoleExists } from '../postgres/repositories/person-role'
import type { RoleName } from '../types/role'

export type AssertPersonRoleAvailableInput = {
  personId: string
  role: RoleName
}

export async function assertPersonRoleAvailable(
  input: AssertPersonRoleAvailableInput,
): Promise<void> {
  const exists = await personRoleExists(input.personId, input.role)
  if (exists) {
    throw new ConflictError('person_role ya existe', {
      entity: 'person_role',
    })
  }
}
