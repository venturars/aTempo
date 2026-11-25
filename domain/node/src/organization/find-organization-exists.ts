import { fail } from '../errors'
import { findOrganizationById } from '../postgres/executors/organization'

export type FindOrganizationExistsInput = {
  id: string
}

export async function findOrganizationExists(
  input: FindOrganizationExistsInput,
): Promise<void> {
  const organization = await findOrganizationById(input.id)
  if (!organization) {
    fail('organization', 'missing')
  }
}
