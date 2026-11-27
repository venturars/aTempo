import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'
import type { Email } from './email'
import type { IdentificationDocument, TaxId } from './identifier'
import { OrganizationRepository } from './organization-repository'
import { PersonRepository } from './person-repository'
import type { Uuid } from './scalars'

export async function assertUniqueTaxId(
  organizations: OrganizationRepository,
  taxId: TaxId,
  exceptOrganizationId?: Uuid,
): Promise<Result<void>> {
  const existing = await organizations.findByTaxId(taxId)
  if (existing && existing.id !== exceptOrganizationId) {
    return err(new AppError('CONFLICT', 'El tax_id ya existe.'))
  }
  return ok(undefined)
}

export async function assertUniquePersonKeys(
  persons: PersonRepository,
  input: {
    email: Email
    identificationDocument: IdentificationDocument
    exceptPersonId?: Uuid
  },
): Promise<Result<void>> {
  const byEmail = await persons.findByEmail(input.email)
  if (byEmail && byEmail.id !== input.exceptPersonId) {
    return err(new AppError('CONFLICT', 'El correo ya existe.'))
  }
  const byDocument = await persons.findByIdentificationDocument(
    input.identificationDocument,
  )
  if (byDocument && byDocument.id !== input.exceptPersonId) {
    return err(new AppError('CONFLICT', 'El documento ya existe.'))
  }
  return ok(undefined)
}