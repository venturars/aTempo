import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

/** Texto obligatorio recortado (p. ej. `name`, `first_name`). */
export type NonEmptyText = string & { readonly __nonEmpty?: unique symbol }

/** Teléfono opcional; columna PostgreSQL `text` nullable. */
export type Phone = NonEmptyText

export function asNonEmptyText(value: string): NonEmptyText {
  return value as NonEmptyText
}

export function parseNonEmptyText(
  value: string,
  field: string,
): Result<NonEmptyText> {
  const trimmed = value.trim()
  if (!trimmed) {
    return err(new AppError('VALIDATION', `${field} es obligatorio.`))
  }
  return ok(asNonEmptyText(trimmed))
}

export function parseOptionalPhone(
  value: string | null | undefined,
): Phone | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : asNonEmptyText(trimmed)
}