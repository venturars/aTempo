import { fail } from '../errors'
import { addOrganizationRow } from '../postgres/executors/organization'
import {
  assertOrganization,
  assertOrganizationCreate,
  type Organization,
  type OrganizationCreate,
} from '../types/organization'
import { findTaxIdAvailable } from './find-tax-id-available'

export type AddOrganizationInput = {
  organization: OrganizationCreate
}

export type AddOrganizationOutput = {
  organization: Organization
}

export async function addOrganization(
  input: AddOrganizationInput,
): Promise<AddOrganizationOutput> {
  const organization = assertOrganizationCreate(input.organization)
  await findTaxIdAvailable({ taxId: organization.tax_id })

  const row = await addOrganizationRow(organization)
  if (!row) {
    fail('organization', 'not_created')
  }

  return { organization: assertOrganization(row) }
}
