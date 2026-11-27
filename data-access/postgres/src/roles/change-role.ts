import { ensurePersonExists } from '../people/rules'
import {
  addPersonRoleRow,
  removePersonRoleRow,
} from '../postgres/executors/person-role'
import { withTransaction } from '../postgres/pool'
import { assertUuid, normalizeUuid } from '../shared/validation/assert'
import { assertPersonRole } from '../shared/validation/person-role'
import { assertRoleName } from '../shared/validation/role'
import type { PersonRole } from '../shared/types/person-role'
import type { RoleName } from '../shared/types/role'
import {
  ensureNotInCourses,
  ensurePersonHasRole,
  ensureRoleAvailable,
  ensureRoleChangeAllowed,
  ensureStudentExclusive,
} from './rules'

export type ChangeRoleInput = {
  personId: string
  from: RoleName
  to: RoleName
}

export type ChangeRoleOutput = {
  personRole: PersonRole
}

/**
 * Cambia un rol de una persona por otro, por ejemplo de student a teacher.
 * Quita `from` y pone `to` en la misma transacción: si algo falla, la persona
 * se queda con el rol que tenía.
 */
export async function changeRole(
  input: ChangeRoleInput,
): Promise<ChangeRoleOutput> {
  const personId = normalizeUuid(
    assertUuid(input.personId, 'person_role.person_id'),
  )
  const from = assertRoleName(input.from, 'person_role.role')
  const to = assertRoleName(input.to, 'person_role.role')
  ensureRoleChangeAllowed({ from, to })

  const changed = await withTransaction(async (run) => {
    await ensurePersonExists({ id: personId }, run)
    await ensurePersonHasRole({ personId, role: from }, run)
    await ensureNotInCourses({ personId }, run)

    await removePersonRoleRow(personId, from, run)
    await ensureStudentExclusive({ personId, role: to }, run)
    await ensureRoleAvailable({ personId, role: to }, run)

    const row = await addPersonRoleRow({ person_id: personId, role: to }, run)
    return assertPersonRole(row)
  })

  return { personRole: changed }
}
