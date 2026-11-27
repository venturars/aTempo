import { fail } from '../shared/errors'
import {
  findOrganizationById,
  findOrganizationIdByTaxId,
} from '../postgres/executors/organization'
import { query, type PostgresQuery } from '../postgres/pool'
import {
  assertNonEmptyString,
  normalizeUuid,
} from '../shared/validation/assert'

export type EnsureOrganizationExistsInput = {
  id: string
}

/** Lanza `organization.missing` si la organización no existe. */
export async function ensureOrganizationExists(
  input: EnsureOrganizationExistsInput,
  run: PostgresQuery = query,
): Promise<void> {
  const organization = await findOrganizationById(input.id, run)
  if (!organization) {
    fail('organization', 'missing')
  }
}

export type EnsureTaxIdAvailableInput = {
  taxId: string
  ignoreId?: string
}

/**
 * Lanza `organization.tax_id.taken` si otra organización ya usa ese tax_id.
 * `ignoreId` es la organización que se modifica: su propio tax_id no cuenta.
 */
export async function ensureTaxIdAvailable(
  input: EnsureTaxIdAvailableInput,
  run: PostgresQuery = query,
): Promise<void> {
  const taxId = assertNonEmptyString(input.taxId, 'organization.tax_id')
  const foundId = await findOrganizationIdByTaxId(taxId.toLowerCase(), run)
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
