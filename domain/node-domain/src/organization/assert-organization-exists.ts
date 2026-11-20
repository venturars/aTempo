import { getOrganizationById } from './get-organization-by-id'

export async function assertOrganizationExists(id: string): Promise<void> {
  const organization = await getOrganizationById(id)
  if (!organization) {
    throw new Error('organization no existe')
  }
}
