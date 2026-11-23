import { fail } from '../errors'
import { personRoleExists } from '../postgres/executors/person-role'
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
    fail('person_role', 'taken')
  }
}
