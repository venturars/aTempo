import { listOrganizations as listOrganizationRows } from '../postgres/executors/organization'
import { assertOrganization, type Organization } from '../types/organization'

export type ListOrganizationsOutput = {
  organizations: Organization[]
}

export async function listOrganizations(): Promise<ListOrganizationsOutput> {
  const rows = await listOrganizationRows()
  return { organizations: rows.map((row) => assertOrganization(row)) }
}
