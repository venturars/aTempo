import { assertNonEmptyString, assertUuid, normalizeUuid } from './assert'

export interface Organization {
  id: string
  name: string
  tax_id: string
}

export type OrganizationInput = Omit<Organization, 'id'>

export function assertOrganizationInput(value: unknown): OrganizationInput {
  if (value === null || typeof value !== 'object') {
    throw new Error('organization debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertNonEmptyString(row.name, 'organization.name')
  assertNonEmptyString(row.tax_id, 'organization.tax_id')
  return {
    name: row.name,
    tax_id: row.tax_id,
  }
}

export function assertOrganization(value: unknown): Organization {
  if (value === null || typeof value !== 'object') {
    throw new Error('organization debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'organization.id')
  return {
    id: normalizeUuid(row.id),
    ...assertOrganizationInput(value),
  }
}
