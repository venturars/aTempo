export interface Organization {
  id: string
  name: string
  tax_id: string
}

export type OrganizationCreate = Omit<Organization, 'id'>

export type OrganizationUpdate = Organization

/** Campos que cambia un modify. Lo que no viene se queda como está. */
export type OrganizationChanges = Partial<OrganizationCreate>
