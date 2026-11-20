// Pantalla de prueba: lee GET /organization de api-postgresql.
// Los campos son los de OrganizationResponseDto en api-postgresql.
export type Organization = {
  id: string
  name: string
  tax_id: string
}

export const organizationListUrl = 'http://localhost:3001/organization'

export async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetch(organizationListUrl)

  if (!response.ok) {
    throw new Error(`La API de organizaciones respondió ${response.status}.`)
  }

  return response.json()
}
