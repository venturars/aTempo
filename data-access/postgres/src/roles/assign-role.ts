import { ensurePersonExists } from '../people/rules'
import { addPersonRoleRow } from '../postgres/executors/person-role'
import { withTransaction } from '../postgres/pool'
import { assertPersonRole } from '../shared/validation/person-role'
import type { PersonRole } from '../shared/types/person-role'
import type { RoleName } from '../shared/types/role'
import {
  ensureRoleAvailable,
  ensureRoleIsNotAdmin,
  ensureStudentExclusive,
} from './rules'

export type AssignRoleInput = {
  personId: string
  role: RoleName
}

export type AssignRoleOutput = {
  personRole: PersonRole
}

/**
 * Da un rol más a una persona. Un student no puede llevar otro rol, y
 * organization_admin solo se da al registrar la organización.
 */
export async function assignRole(
  input: AssignRoleInput,
): Promise<AssignRoleOutput> {
  const personRole = assertPersonRole({
    person_id: input.personId,
    role: input.role,
  })
  const personId = personRole.person_id
  const role = personRole.role
  ensureRoleIsNotAdmin(role)

  const created = await withTransaction(async (run) => {
    await ensurePersonExists({ id: personId }, run)
    await ensureStudentExclusive({ personId, role }, run)
    await ensureRoleAvailable({ personId, role }, run)

    const row = await addPersonRoleRow(personRole, run)
    return assertPersonRole(row)
  })

  return { personRole: created }
}
