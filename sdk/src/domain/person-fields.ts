import { parseEmail, type Email } from './email'
import {
  parseIdentificationDocument,
  type IdentificationDocument,
} from './identifier'
import { parseDateOnly, type DateOnly } from './scalars'
import {
  parseNonEmptyText,
  parseOptionalPhone,
  type NonEmptyText,
  type Phone,
} from './text'
import { ok, Result } from '../shared/result'

/** Entrada HTTP o formulario antes de normalizar. */
export type PersonFieldInput = {
  firstName: string
  lastName: string
  identificationDocument: string
  email: string
  birthDate?: string | null
  phone?: string | null
}

export type NormalizedPersonFields = {
  firstName: NonEmptyText
  lastName: NonEmptyText
  identificationDocument: IdentificationDocument
  email: Email
  birthDate: DateOnly | null
  phone: Phone | null
}

function optionalBirthDate(
  value: string | null | undefined,
): Result<DateOnly | null> {
  if (value === undefined || value === null) return ok(null)
  const trimmed = value.trim()
  if (trimmed === '') return ok(null)
  return parseDateOnly(trimmed)
}

export function normalizePersonFields(
  input: PersonFieldInput,
): Result<NormalizedPersonFields> {
  const firstName = parseNonEmptyText(input.firstName, 'El nombre')
  if (!firstName.ok) return firstName
  const lastName = parseNonEmptyText(input.lastName, 'Los apellidos')
  if (!lastName.ok) return lastName
  const identificationDocument = parseIdentificationDocument(
    input.identificationDocument,
  )
  if (!identificationDocument.ok) return identificationDocument
  const email = parseEmail(input.email)
  if (!email.ok) return email
  const birthDate = optionalBirthDate(input.birthDate)
  if (!birthDate.ok) return birthDate
  return ok({
    firstName: firstName.value,
    lastName: lastName.value,
    identificationDocument: identificationDocument.value,
    email: email.value,
    birthDate: birthDate.value,
    phone: parseOptionalPhone(input.phone),
  })
}