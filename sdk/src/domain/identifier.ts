import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

const FISCAL_IDENTIFIER = /^[A-Z0-9]{5,20}$/

/** Documento fiscal normalizado; `organization.tax_id`. */
export type TaxId = string & { readonly __taxId?: unique symbol }

/** Documento de identidad normalizado; `person.identification_document`. */
export type IdentificationDocument = string & {
  readonly __identificationDocument?: unique symbol
}

export function asTaxId(value: string): TaxId {
  return value as TaxId
}

export function asIdentificationDocument(value: string): IdentificationDocument {
  return value as IdentificationDocument
}

function parseFiscalIdentifier(
  value: string,
  field: string,
): Result<string> {
  const normalized = value.replace(/[\s.-]/g, '').toUpperCase()
  if (!FISCAL_IDENTIFIER.test(normalized)) {
    return err(
      new AppError(
        'VALIDATION',
        `${field} debe tener entre 5 y 20 letras o cifras.`,
      ),
    )
  }
  return ok(normalized)
}

export function parseTaxId(value: string): Result<TaxId> {
  const normalized = parseFiscalIdentifier(value, 'El tax_id')
  if (!normalized.ok) return normalized
  return ok(asTaxId(normalized.value))
}

export function parseIdentificationDocument(
  value: string,
): Result<IdentificationDocument> {
  const normalized = parseFiscalIdentifier(value, 'El documento')
  if (!normalized.ok) return normalized
  return ok(asIdentificationDocument(normalized.value))
}