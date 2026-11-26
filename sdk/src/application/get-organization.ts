import { Organization } from '../domain/organization'
import { OrganizationRepository } from '../domain/organization-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type GetOrganizationInput = { organizationId: string }

export type GetOrganizationDeps = {
  organizations: OrganizationRepository
}

export function createGetOrganization(deps: GetOrganizationDeps) {
  return async function getOrganization({
    organizationId,
  }: GetOrganizationInput): Promise<Result<Organization>> {
    const parsedId = parseUuid(organizationId)
    if (!parsedId.ok) return parsedId

    const organization = await deps.organizations.findById(parsedId.value)
    if (!organization) {
      return err(new AppError('NOT_FOUND', 'La organización no existe.'))
    }
    return ok(organization)
  }
}
