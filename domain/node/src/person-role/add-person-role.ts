import { PersistenceError } from '../errors'
import { assertPersonExists } from '../person/assert-person-exists'
import { insertPersonRole } from '../postgres/repositories/person-role'
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
    throw new PersistenceError('person_role no se ha creado', {
      entity: 'person_role',
    })
  }

  return { personRole: assertPersonRole(row) }
}
