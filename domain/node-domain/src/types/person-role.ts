import { assertUuid, normalizeUuid } from './assert'
import { assertRoleName, type RoleName } from './role'

export interface PersonRole {
  person_id: string
  role: RoleName
}

export function assertPersonRole(
  value: unknown,
): asserts value is PersonRole {
  if (value === null || typeof value !== 'object') {
    throw new Error('person_role debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.person_id, 'person_role.person_id')
  row.person_id = normalizeUuid(row.person_id)
  assertRoleName(row.role, 'person_role.role')
}
