import type { Uuid } from './scalars'

export type PersonRole = 'organization_admin' | 'teacher' | 'student'

/** Fila de la tabla `person_role` (un rol por fila). */
export type PersonRoleAssignment = {
  readonly personId: Uuid
  readonly role: PersonRole
}