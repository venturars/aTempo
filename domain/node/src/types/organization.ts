import {
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

export type Organization = {
  id: string
  name: string
  tax_id: string
}

export type OrganizationCreate = Omit<Organization, 'id'>

export type OrganizationUpdate = Organization

export function assertOrganizationCreate(
  value: OrganizationCreate,
): OrganizationCreate {
  return organizationFields(value, false)
}

export function assertOrganization(value: Organization): Organization {
  return organizationWithId(value, true)
}

export function assertOrganizationUpdate(
  value: OrganizationUpdate,
): OrganizationUpdate {
  return organizationWithId(value, false)
}

function organizationWithId(
  value: Organization,
  allowEmpty: boolean,
): Organization {
  assertObject(value, 'organization')
  assertUuid(value.id, 'organization.id')
  return {
    id: normalizeUuid(value.id),
    ...organizationFields(value, allowEmpty),
  }
}

function organizationFields(
  value: OrganizationCreate,
  allowEmpty: boolean,
): OrganizationCreate {
  assertObject(value, 'organization')
  assertString(value.name, 'organization.name', allowEmpty)
  assertString(value.tax_id, 'organization.tax_id', allowEmpty)
  return {
    name: value.name,
    tax_id: value.tax_id,
  }
}
