import { fail } from '../shared/errors'
import { findOrganizationIdByTaxId } from '../postgres/executors/organization'
import {
  assertNonEmptyString,
  normalizeUuid,
} from '../shared/validation/assert'

export type FindTaxIdAvailableInput = {
  taxId: string
  ignoreId?: string
}

export async function findTaxIdAvailable(
  input: FindTaxIdAvailableInput,
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
