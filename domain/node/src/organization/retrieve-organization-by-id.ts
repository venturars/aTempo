import { findOrganizationById } from '../postgres/executors/organization'
import { assertUuid } from '../types/assert'
import { assertOrganization, type Organization } from '../types/organization'

export type RetrieveOrganizationByIdInput = {
  id: string
}

export type RetrieveOrganizationByIdOutput = {
  organization: Organization | null
}

export async function retrieveOrganizationById(
  input: RetrieveOrganizationByIdInput,
): Promise<RetrieveOrganizationByIdOutput> {
  const id = assertUuid(input.id, 'organization.id')
  const row = await findOrganizationById(id)
  if (!row) {
    return { organization: null }
  }

  return { organization: assertOrganization(row) }
}
