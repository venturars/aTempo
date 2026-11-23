import { ValidationError, labelParts } from '../errors'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertString(
  value: string,
  label: string,
  allowEmpty = false,
): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    throw new ValidationError(`${label} debe ser un string no vacío`, {
      ...labelParts(label),
    })
  }
  return value
}

export function assertNonEmptyString(value: string, label: string): string {
  return assertString(value, label)
}

export function assertUuid(value: string, label: string): string {
  assertNonEmptyString(value, label)
  if (!UUID_RE.test(value)) {
    throw new ValidationError(`${label} debe ser un uuid`, {
      ...labelParts(label),
    })
  }
  return value
}

export function normalizeUuid(value: string): string {
  return value.toLowerCase()
}

export function assertCalendarDate(
  year: number,
  month: number,
  day: number,
  label: string,
): void {
  if (year < 1 || year > 9999) {
    throw new ValidationError(`${label} debe ser una fecha`, {
      ...labelParts(label),
    })
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCFullYear(year)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ValidationError(`${label} debe ser una fecha`, {
      ...labelParts(label),
    })
  }
}

export function assertNullableString(
  value: string | null,
  label: string,
): string | null {
  if (value !== null && typeof value !== 'string') {
    throw new ValidationError(`${label} debe ser string o null`, {
      ...labelParts(label),
    })
  }
  return value
}

export function assertObject<T extends object>(value: T, label: string): T {
  if (value === null || typeof value !== 'object') {
    throw new ValidationError(`${label} debe ser un objeto`, {
      entity: label,
    })
  }
  return value
}
