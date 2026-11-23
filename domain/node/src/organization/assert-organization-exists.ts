import { fail } from '../errors'
import { findOrganizationById } from '../postgres/executors/organization'

export type AssertOrganizationExistsInput = {
  id: string
}

export async function assertOrganizationExists(
  input: AssertOrganizationExistsInput,
): Promise<void> {
  const organization = await findOrganizationById(input.id)
  if (!organization) {
    fail('organization', 'missing')
  }
}
