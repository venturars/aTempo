import { fail } from '../errors'
import { findOrganizationIdByTaxId } from '../postgres/executors/organization'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'

export type AssertTaxIdAvailableInput = {
  taxId: string
  ignoreId?: string
}

export async function assertTaxIdAvailable(
  input: AssertTaxIdAvailableInput,
): Promise<void> {
  const taxId = assertNonEmptyString(input.taxId, 'organization.tax_id')
  const foundId = await findOrganizationIdByTaxId(taxId.toLowerCase())
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('organization.tax_id', 'taken')
  }
}
