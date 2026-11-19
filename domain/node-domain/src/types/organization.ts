import { assertNonEmptyString, assertUuid } from './assert'

export interface Organization {
  id: string
  name: string
  tax_id: string
}

export type OrganizationInput = Omit<Organization, 'id'>

export function assertOrganizationInput(
  value: unknown,
): asserts value is OrganizationInput {
  if (value === null || typeof value !== 'object') {
    throw new Error('organization debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertNonEmptyString(row.name, 'organization.name')
  assertNonEmptyString(row.tax_id, 'organization.tax_id')
}

export function assertOrganization(
  value: unknown,
): asserts value is Organization {
  if (value === null || typeof value !== 'object') {
    throw new Error('organization debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'organization.id')
  assertOrganizationInput(value)
}
