import { assertNonEmptyString } from './assert'

export const ROLE_NAMES = [
  'organization_admin',
  'teacher',
  'student',
] as const

export type RoleName = (typeof ROLE_NAMES)[number]

export interface Role {
  name: RoleName
}

export function isRoleName(value: string): value is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(value)
}

export function assertRoleName(
  value: unknown,
  label = 'role.name',
): asserts value is RoleName {
  assertNonEmptyString(value, label)
  if (!isRoleName(value)) {
    throw new Error(`${label} debe ser organization_admin, teacher o student`)
  }
}

export function assertRole(value: unknown): asserts value is Role {
  if (value === null || typeof value !== 'object') {
    throw new Error('role debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertRoleName(row.name)
}
