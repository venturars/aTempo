import { assertObject, assertUuid, normalizeUuid } from './assert'
import { assertRoleName, type RoleName } from './role'

export type PersonRole = {
  person_id: string
  role: RoleName
}

export function assertPersonRole(value: PersonRole): PersonRole {
  assertObject(value, 'person_role')
  assertUuid(value.person_id, 'person_role.person_id')
  return {
    person_id: normalizeUuid(value.person_id),
    role: assertRoleName(value.role, 'person_role.role'),
  }
}
