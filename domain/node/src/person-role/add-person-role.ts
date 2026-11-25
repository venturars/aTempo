import { fail } from '../errors'
import { findPersonExists } from '../person/find-person-exists'
import { addPersonRole as addPersonRoleRow } from '../postgres/executors/person-role'
import { assertPersonRole, type PersonRole } from '../types/person-role'
import { findPersonRoleAvailable } from './find-person-role-available'
import { findStudentExclusive } from './find-student-exclusive'

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
  await findPersonExists({ id: personRole.person_id })
  await findStudentExclusive({
    personId: personRole.person_id,
    role: personRole.role,
  })
  await findPersonRoleAvailable({
    personId: personRole.person_id,
    role: personRole.role,
  })

  const row = await addPersonRoleRow(personRole)
  if (!row) {
    fail('person_role', 'not_created')
  }

  return { personRole: assertPersonRole(row) }
}
