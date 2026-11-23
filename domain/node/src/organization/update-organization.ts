import { updateOrganizationRow } from '../postgres/executors/organization'
import {
  assertOrganization,
  assertOrganizationUpdate,
  type Organization,
  type OrganizationUpdate,
} from '../types/organization'
import { assertTaxIdAvailable } from './assert-tax-id-available'

export type UpdateOrganizationInput = {
  organization: OrganizationUpdate
}

export type UpdateOrganizationOutput = {
  organization: Organization | null
}

export async function updateOrganization(
  input: UpdateOrganizationInput,
): Promise<UpdateOrganizationOutput> {
  const organization = assertOrganizationUpdate(input.organization)
  await assertTaxIdAvailable({
    taxId: organization.tax_id,
    ignoreId: organization.id,
  })

  const row = await updateOrganizationRow(organization)
  if (!row) {
    return { organization: null }
  }

  return { organization: assertOrganization(row) }
}
