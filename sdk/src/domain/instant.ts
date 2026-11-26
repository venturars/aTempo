import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export function parseInstant(value: string, field: string): Result<string> {
  const trimmed = value.trim()
  const time = Date.parse(trimmed)
  if (!Number.isFinite(time)) {
    return err(new AppError('VALIDATION', `${field} debe ser una fecha ISO 8601.`))
  }
  return ok(trimmed)
}

export function assertEndsAfterStart(
  startAt: string,
  endAt: string,
): Result<void> {
  if (Date.parse(endAt) <= Date.parse(startAt)) {
    return err(
      new AppError(
        'VALIDATION',
        'La fecha de fin debe ser posterior a la de inicio.',
      ),
    )
  }
  return ok(undefined)
}