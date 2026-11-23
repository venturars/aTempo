import { NotFoundError } from '../errors'
import { findOrganizationById } from '../postgres/repositories/organization'

export type AssertOrganizationExistsInput = {
  id: string
}

export async function assertOrganizationExists(
  input: AssertOrganizationExistsInput,
): Promise<void> {
  const organization = await findOrganizationById(input.id)
  if (!organization) {
    throw new NotFoundError('organization no existe', {
      entity: 'organization',
    })
  }
}
