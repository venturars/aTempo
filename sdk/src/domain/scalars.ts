import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

/** Identificador UUID v4; columna PostgreSQL `uuid`. */
export type Uuid = string & { readonly __uuid?: unique symbol }

/** Fecha de calendario ISO `YYYY-MM-DD`; columna PostgreSQL `date`. */
export type DateOnly = string & { readonly __dateOnly?: unique symbol }

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function asUuid(value: string): Uuid {
  return value as Uuid
}

export function parseUuid(value: string): Result<Uuid> {
  const trimmed = value.trim()
  if (!UUID_PATTERN.test(trimmed)) {
    return err(new AppError('VALIDATION', 'El identificador no es un UUID válido.'))
  }
  return ok(asUuid(trimmed))
}

export function parseDateOnly(value: string): Result<DateOnly> {
  const trimmed = value.trim()
  if (!DATE_ONLY_PATTERN.test(trimmed)) {
    return err(new AppError('VALIDATION', 'La fecha debe ser YYYY-MM-DD.'))
  }
  return ok(trimmed as DateOnly)
}