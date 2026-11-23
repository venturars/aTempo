import { findOrganizationById } from '../postgres/executors/organization'
import { assertUuid } from '../types/assert'
import { assertOrganization, type Organization } from '../types/organization'

export type GetOrganizationByIdInput = {
  id: string
}

export type GetOrganizationByIdOutput = {
  organization: Organization | null
}

export async function getOrganizationById(
  input: GetOrganizationByIdInput,
): Promise<GetOrganizationByIdOutput> {
  const id = assertUuid(input.id, 'organization.id')
  const row = await findOrganizationById(id)
  if (!row) {
    return { organization: null }
  }

  return { organization: assertOrganization(row) }
}
