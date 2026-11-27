import { fail, type DomainLabel } from '../errors'
import type { Role, RoleName } from '../types/role'
import { assertNonEmptyString, assertObject } from './assert'

export const ROLE_NAMES = [
  'organization_admin',
  'teacher',
  'student',
] as const satisfies readonly RoleName[]

// Fails to compile if a RoleName is missing from ROLE_NAMES.
type MissingRoleName = Exclude<RoleName, (typeof ROLE_NAMES)[number]>
export const ROLE_NAMES_COVER_ROLE_NAME: [MissingRoleName] extends [never]
  ? true
  : MissingRoleName = true

export function isRoleName(value: string): value is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(value)
}

export function assertRoleName(
  value: unknown,
  label: DomainLabel = 'role.name',
): RoleName {
  const name = assertNonEmptyString(value, label)
  if (!isRoleName(name)) {
    fail(label, 'format')
  }
  return name
}

export function assertRole(value: unknown): Role {
  const role = assertObject(value, 'role')
  return { name: assertRoleName(role.name) }
}
