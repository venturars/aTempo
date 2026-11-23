import { fail } from '../errors'
import { assertPersonExists } from '../person/assert-person-exists'
import { insertPersonRole } from '../postgres/executors/person-role'
import { assertPersonRole, type PersonRole } from '../types/person-role'
import { assertPersonRoleAvailable } from './assert-person-role-available'
import { assertStudentExclusive } from './assert-student-exclusive'

export type AddPersonRoleInput = {
  personRole: PersonRole
}

export type AddPersonRoleOutput = {
  personRole: PersonRole
}

export async function addPersonRole(
  input: AddPersonRoleInput,
): Promise<AddPersonRoleOutput> {
  const personRole = assertPersonRole(input.personRole)
  await assertPersonExists({ id: personRole.person_id })
  await assertStudentExclusive({
    personId: personRole.person_id,
    role: personRole.role,
  })
  await assertPersonRoleAvailable({
    personId: personRole.person_id,
    role: personRole.role,
  })

  const row = await insertPersonRole(personRole)
  if (!row) {
    fail('person_role', 'not_created')
  }

  return { personRole: assertPersonRole(row) }
}
