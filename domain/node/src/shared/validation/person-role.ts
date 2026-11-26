import type { PersonRole } from '../types/person-role'
import { assertObject, assertUuid, normalizeUuid } from './assert'
import { assertRoleName } from './role'

export function assertPersonRole(value: unknown): PersonRole {
  const personRole = assertObject(value, 'person_role')
  const personId = assertUuid(personRole.person_id, 'person_role.person_id')
  return {
    person_id: normalizeUuid(personId),
    role: assertRoleName(personRole.role, 'person_role.role'),
  }
}
