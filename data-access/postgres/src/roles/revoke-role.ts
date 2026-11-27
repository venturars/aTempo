import { removePersonRoleRow } from '../postgres/executors/person-role'
import { withTransaction } from '../postgres/pool'
import { assertPersonRole } from '../shared/validation/person-role'
import type { PersonRole } from '../shared/types/person-role'
import type { RoleName } from '../shared/types/role'
import { ensureNotInCourses, ensureRoleIsNotAdmin } from './rules'

export type RevokeRoleInput = {
  personId: string
  role: RoleName
}

export type RevokeRoleOutput = {
  personRole: PersonRole
}

/**
 * Quita un rol a una persona y devuelve el rol borrado. Lanza
 * `person_role.missing` si no lo tenía.
 * Un student o un teacher que está en algún curso no pierde su rol hasta que
 * deja esos cursos, igual que en `changeRole`. organization_admin no se quita.
 */
export async function revokeRole(
  input: RevokeRoleInput,
): Promise<RevokeRoleOutput> {
  const personRole = assertPersonRole({
    person_id: input.personId,
    role: input.role,
  })
  const personId = personRole.person_id
  const role = personRole.role
  ensureRoleIsNotAdmin(role)

  const removed = await withTransaction(async (run) => {
    await ensureNotInCourses({ personId }, run)
    return removePersonRoleRow(personId, role, run)
  })

  return { personRole: assertPersonRole(removed) }
}
