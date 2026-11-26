export interface Organization {
  id: string
  name: string
  tax_id: string
}

export type OrganizationCreate = Omit<Organization, 'id'>

export type OrganizationUpdate = Organization
