import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

/** Correo normalizado (minúsculas, recortado); columna PostgreSQL `text`. */
export type Email = string & { readonly __email?: unique symbol }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function asEmail(value: string): Email {
  return value as Email
}

export function parseEmail(value: string): Result<Email> {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return err(new AppError('VALIDATION', 'El correo es obligatorio.'))
  }
  if (!EMAIL_PATTERN.test(normalized)) {
    return err(new AppError('VALIDATION', 'Escribe un correo válido.'))
  }
  return ok(asEmail(normalized))
}