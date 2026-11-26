import { parseTaxId } from '../domain/identifier'
import { Organization } from '../domain/organization'
import { OrganizationRepository } from '../domain/organization-repository'
import { parseUuid } from '../domain/scalars'
import { parseNonEmptyText } from '../domain/text'
import { assertUniqueTaxId } from '../domain/uniqueness'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type PatchOrganizationInput = {
  organizationId: string
  name?: string
  taxId?: string
}

export type PatchOrganizationDeps = {
  organizations: OrganizationRepository
}

export function createPatchOrganization(deps: PatchOrganizationDeps) {
  return async function patchOrganization(
    input: PatchOrganizationInput,
  ): Promise<Result<Organization>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId

    const organization = await deps.organizations.findById(organizationId.value)
    if (!organization) {
      return err(new AppError('NOT_FOUND', 'La organización no existe.'))
    }

    let name = organization.name
    if (input.name !== undefined) {
      const parsedName = parseNonEmptyText(input.name, 'El nombre')
      if (!parsedName.ok) return parsedName
      name = parsedName.value
    }

    let taxId = organization.taxId
    if (input.taxId !== undefined) {
      const normalized = parseTaxId(input.taxId)
      if (!normalized.ok) return normalized
      const uniqueTax = await assertUniqueTaxId(
        deps.organizations,
        normalized.value,
        organization.id,
      )
      if (!uniqueTax.ok) return uniqueTax
      taxId = normalized.value
    }

    const next: Organization = { ...organization, name, taxId }
    await deps.organizations.save(next)
    return ok(next)
  }
}