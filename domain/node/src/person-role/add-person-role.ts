import { fail } from '../shared/errors'
import { findPersonExists } from '../person/find-person-exists'
import { addPersonRoleRow } from '../postgres/executors/person-role'
import { withTransaction } from '../postgres/pool'
import { assertPersonRole } from '../shared/validation/person-role'
import type { PersonRole } from '../shared/types/person-role'
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

  const created = await withTransaction(async (run) => {
    await findPersonExists({ id: personRole.person_id }, run)
    await findStudentExclusive(
      { personId: personRole.person_id, role: personRole.role },
      run,
    )
    await findPersonRoleAvailable(
      { personId: personRole.person_id, role: personRole.role },
      run,
    )

    const row = await addPersonRoleRow(personRole, run)
    if (!row) {
      fail('person_role', 'not_created')
    }

    return assertPersonRole(row)
  })

  return { personRole: created }
}
