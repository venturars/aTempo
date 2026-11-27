import { retrieveAllOrganizationRows } from '../postgres/executors/organization'
import { assertOrganization } from '../shared/validation/organization'
import type { Organization } from '../shared/types/organization'

export type RetrieveAllOrganizationsOutput = {
  organizations: Organization[]
}

export async function retrieveAllOrganizations(): Promise<RetrieveAllOrganizationsOutput> {
  const rows = await retrieveAllOrganizationRows()
  return { organizations: rows.map((row) => assertOrganization(row)) }
}
