import { fail } from '../shared/errors'
import {
  findOrganizationById,
  updateOrganizationRow,
} from '../postgres/executors/organization'
import { withTransaction } from '../postgres/pool'
import { assertUuid, normalizeUuid } from '../shared/validation/assert'
import {
  assertOrganization,
  assertOrganizationChanges,
  assertOrganizationUpdate,
} from '../shared/validation/organization'
import type {
  Organization,
  OrganizationChanges,
} from '../shared/types/organization'
import { ensureTaxIdAvailable } from './rules'

export type ModifyOrganizationInput = {
  id: string
  changes: OrganizationChanges
}

export type ModifyOrganizationOutput = {
  organization: Organization
}

/**
 * Cambia solo los campos que vienen en `changes`. Las reglas se comprueban
 * sobre la organización completa, ya con los cambios aplicados.
 */
export async function modifyOrganization(
  input: ModifyOrganizationInput,
): Promise<ModifyOrganizationOutput> {
  const id = normalizeUuid(assertUuid(input.id, 'organization.id'))
  const changes = assertOrganizationChanges(input.changes)

  const modified = await withTransaction(async (run) => {
    const current = await findOrganizationById(id, run)
    if (!current) {
      fail('organization', 'missing')
    }

    const organization = assertOrganizationUpdate({
      ...assertOrganization(current),
      ...changes,
      id,
    })
    await ensureTaxIdAvailable(
      { taxId: organization.tax_id, ignoreId: id },
      run,
    )

    const row = await updateOrganizationRow(organization, run)
    return assertOrganization(row)
  })

  return { organization: modified }
}
