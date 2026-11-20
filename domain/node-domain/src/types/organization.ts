import { assertString, assertUuid, normalizeUuid } from './assert'

export interface Organization {
  id: string
  name: string
  tax_id: string
}

export type OrganizationInput = Omit<Organization, 'id'>

export function assertOrganizationInput(value: unknown): OrganizationInput {
  return organizationFields(value, false)
}

export function assertOrganization(value: unknown): Organization {
  return organizationWithId(value, true)
}

export function assertOrganizationUpdate(value: unknown): Organization {
  return organizationWithId(value, false)
}

function organizationWithId(
  value: unknown,
  allowEmpty: boolean,
): Organization {
  if (value === null || typeof value !== 'object') {
    throw new Error('organization debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'organization.id')
  return {
    id: normalizeUuid(row.id),
    ...organizationFields(value, allowEmpty),
  }
}

function organizationFields(
  value: unknown,
  allowEmpty: boolean,
): OrganizationInput {
  if (value === null || typeof value !== 'object') {
    throw new Error('organization debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertString(row.name, 'organization.name', allowEmpty)
  assertString(row.tax_id, 'organization.tax_id', allowEmpty)
  return {
    name: row.name,
    tax_id: row.tax_id,
  }
}
