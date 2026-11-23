import { fail, type DomainLabel } from '../errors'
import { assertNonEmptyString, assertObject } from './assert'

export const ROLE_NAMES = [
  'organization_admin',
  'teacher',
  'student',
] as const

export type RoleName = (typeof ROLE_NAMES)[number]

export type Role = {
  name: RoleName
}

export function isRoleName(value: string): value is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(value)
}

export function assertRoleName(
  value: string,
  label: DomainLabel = 'role.name',
): RoleName {
  assertNonEmptyString(value, label)
  if (!isRoleName(value)) {
    fail(label, 'format')
  }
  return value
}

export function assertRole(value: Role): Role {
  assertObject(value, 'role')
  return { name: assertRoleName(value.name) }
}
