import { fail, type ErrorLabel } from '../errors'
import type { Role, RoleName } from '../types/role'
import { assertNonEmptyString, assertObject } from './assert'

export const ROLE_NAMES = [
  'organization_admin',
  'teacher',
  'student',
] as const satisfies readonly RoleName[]

export function isRoleName(value: string): value is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(value)
}

export function assertRoleName(
  value: unknown,
  label: ErrorLabel = 'role.name',
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
