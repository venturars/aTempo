import type {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
} from '../types/organization'
import {
  assertNonEmptyString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

export function assertOrganizationCreate(value: unknown): OrganizationCreate {
  return organizationFields(value, false)
}

export function assertOrganization(value: unknown): Organization {
  return organizationWithId(value, true)
}

export function assertOrganizationUpdate(value: unknown): OrganizationUpdate {
  return organizationWithId(value, false)
}

function organizationWithId(value: unknown, allowEmpty: boolean): Organization {
  const organization = assertObject(value, 'organization')
  const id = assertUuid(organization.id, 'organization.id')
  return {
    id: normalizeUuid(id),
    ...organizationFields(organization, allowEmpty),
  }
}

function organizationFields(
  value: unknown,
  allowEmpty: boolean,
): OrganizationCreate {
  const organization = assertObject(value, 'organization')
  const assertText = allowEmpty ? assertString : assertNonEmptyString
  return {
    name: assertText(organization.name, 'organization.name'),
    tax_id: assertText(organization.tax_id, 'organization.tax_id'),
  }
}
