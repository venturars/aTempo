import { fail, type DomainLabel } from '../errors'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertString(
  value: string,
  label: DomainLabel,
  allowEmpty = false,
): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    fail(label, 'empty')
  }
  return value
}

export function assertNonEmptyString(value: string, label: DomainLabel): string {
  return assertString(value, label)
}

export function assertUuid(value: string, label: DomainLabel): string {
  assertNonEmptyString(value, label)
  if (!UUID_RE.test(value)) {
    fail(label, 'uuid')
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
  label: DomainLabel,
): void {
  if (year < 1 || year > 9999) {
    fail(label, 'date')
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCFullYear(year)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    fail(label, 'date')
  }
}

export function assertNullableString(
  value: string | null,
  label: DomainLabel,
): string | null {
  if (value !== null && typeof value !== 'string') {
    fail(label, 'nullable_string')
  }
  return value
}

export function assertObject<T extends object>(value: T, label: DomainLabel): T {
  if (value === null || typeof value !== 'object') {
    fail(label, 'object')
  }
  return value
}
