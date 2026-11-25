import { insertOrganizationRow } from '../postgres/executors/organization'
import {
  assertOrganization,
  assertOrganizationUpdate,
  type Organization,
  type OrganizationUpdate,
} from '../types/organization'
import { findTaxIdAvailable } from './find-tax-id-available'

export type InsertOrganizationInput = {
  organization: OrganizationUpdate
}

export type InsertOrganizationOutput = {
  organization: Organization | null
}

export async function insertOrganization(
  input: InsertOrganizationInput,
): Promise<InsertOrganizationOutput> {
  const organization = assertOrganizationUpdate(input.organization)
  await findTaxIdAvailable({
    taxId: organization.tax_id,
    ignoreId: organization.id,
  })

  const row = await insertOrganizationRow(organization)
  if (!row) {
    return { organization: null }
  }

  return { organization: assertOrganization(row) }
}
