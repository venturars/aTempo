import type {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  OrganizationChanges,
} from '../types/organization'
import {
  assertChanges,
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

const ORGANIZATION_CHANGEABLE_FIELDS = ['name', 'tax_id'] as const

/**
 * Solo comprueba la forma de los cambios. Sus valores se validan con
 * `assertOrganizationUpdate` al mezclarlos con la fila guardada.
 */
export function assertOrganizationChanges(value: unknown): OrganizationChanges {
  return assertChanges(
    value,
    'organization',
    ORGANIZATION_CHANGEABLE_FIELDS,
  ) as OrganizationChanges
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
