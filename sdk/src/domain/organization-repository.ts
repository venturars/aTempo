import type { TaxId } from './identifier'
import type { Organization } from './organization'
import type { Uuid } from './scalars'

export type OrganizationRepository = {
  findById(organizationId: Uuid): Promise<Organization | null>
  findByTaxId(taxId: TaxId): Promise<Organization | null>
  save(organization: Organization): Promise<void>
}