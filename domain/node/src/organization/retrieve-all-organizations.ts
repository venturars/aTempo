import { retrieveAllOrganizationRows } from '../postgres/executors/organization'
import { assertOrganization, type Organization } from '../types/organization'

export type RetrieveAllOrganizationsOutput = {
  organizations: Organization[]
}

export async function retrieveAllOrganizations(): Promise<RetrieveAllOrganizationsOutput> {
  const rows = await retrieveAllOrganizationRows()
  return { organizations: rows.map((row) => assertOrganization(row)) }
}
