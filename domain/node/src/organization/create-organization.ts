import { PersistenceError } from '../errors'
import { insertOrganization } from '../postgres/executors/organization'
import {
  assertOrganization,
  assertOrganizationCreate,
  type Organization,
  type OrganizationCreate,
} from '../types/organization'
import { assertTaxIdAvailable } from './assert-tax-id-available'

export type CreateOrganizationInput = {
  organization: OrganizationCreate
}

export type CreateOrganizationOutput = {
  organization: Organization
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<CreateOrganizationOutput> {
  const organization = assertOrganizationCreate(input.organization)
  await assertTaxIdAvailable({ taxId: organization.tax_id })

  const row = await insertOrganization(organization)
  if (!row) {
    throw new PersistenceError('organization no se ha creado', {
      entity: 'organization',
    })
  }

  return { organization: assertOrganization(row) }
}
