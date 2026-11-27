import { fail } from '../shared/errors'
import { query, type PostgresQuery } from '../postgres/pool'
import { personHasCourses } from '../postgres/executors/person-course'
import { personRoleExists } from '../postgres/executors/person-role'
import { retrieveAllRolesByPersonId } from '../postgres/executors/role'
import type { RoleName } from '../shared/types/role'

export type PersonRoleInput = {
  personId: string
  role: RoleName
}

/** Lanza `person_role.taken` si la persona ya tiene ese rol. */
export async function ensureRoleAvailable(
  input: PersonRoleInput,
  run: PostgresQuery = query,
): Promise<void> {
  const exists = await personRoleExists(input.personId, input.role, run)
  if (exists) {
    fail('person_role', 'taken')
  }
}

/** Lanza `person_role.missing` si la persona no tiene ese rol. */
export async function ensurePersonHasRole(
  input: PersonRoleInput,
  run: PostgresQuery = query,
): Promise<void> {
  const exists = await personRoleExists(input.personId, input.role, run)
  if (!exists) {
    fail('person_role', 'missing')
  }
}

/**
 * Un student no lleva otro rol. Lanza `person_role.student.exclusive` si se
 * añade student a quien ya tiene otro rol, o cualquier rol a un student.
 */
export async function ensureStudentExclusive(
  input: PersonRoleInput,
  run: PostgresQuery = query,
): Promise<void> {
  const roles = await retrieveAllRolesByPersonId(input.personId, run)
  const names = roles.map((role) => role.name)

  if (input.role === 'student' && names.some((name) => name !== 'student')) {
    fail('person_role.student', 'exclusive')
  }

  if (input.role !== 'student' && names.includes('student')) {
    fail('person_role.student', 'exclusive')
  }
}

/**
 * organization_admin solo lo recibe quien registra la organización
 * (`registerOrganization`). No se da, no se quita y no se cambia después.
 */
export function ensureRoleIsNotAdmin(role: RoleName): void {
  if (role === 'organization_admin') {
    fail('person_role.role', 'protected')
  }
}

export type EnsureRoleChangeAllowedInput = {
  from: RoleName
  to: RoleName
}

/**
 * Reglas del cambio de rol que no necesitan la base:
 * - el rol tiene que cambiar;
 * - organization_admin no entra ni sale con un cambio de rol.
 */
export function ensureRoleChangeAllowed(
  input: EnsureRoleChangeAllowedInput,
): void {
  if (input.from === input.to) {
    fail('person_role.role', 'unchanged')
  }
  ensureRoleIsNotAdmin(input.from)
  ensureRoleIsNotAdmin(input.to)
}

export type EnsureNotInCoursesInput = {
  personId: string
}

/**
 * Lanza `person_role.role.enrolled` si la persona está en algún curso. Un
 * student matriculado o un teacher con cursos no cambia ni pierde su rol hasta
 * que deja esos cursos.
 */
export async function ensureNotInCourses(
  input: EnsureNotInCoursesInput,
  run: PostgresQuery = query,
): Promise<void> {
  const hasCourses = await personHasCourses(input.personId, run)
  if (hasCourses) {
    fail('person_role.role', 'enrolled')
  }
}
