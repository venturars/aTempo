import { fail, type DomainLabel } from '../errors'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Los `assert*` reciben `unknown` porque validan datos que llegan de fuera
 * (un body JSON, una fila de PostgreSQL). Si el valor no vale, lanzan; si vale,
 * lo devuelven con su tipo.
 */

/** Comprueba que es un string. Acepta el string vacío. */
export function assertString(value: unknown, label: DomainLabel): string {
  if (typeof value !== 'string') {
    fail(label, 'string')
  }
  return value
}

/** Comprueba que es un string con al menos un carácter. */
export function assertNonEmptyString(
  value: unknown,
  label: DomainLabel,
): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail(label, 'empty')
  }
  return value
}

export function assertUuid(value: unknown, label: DomainLabel): string {
  const text = assertNonEmptyString(value, label)
  if (!UUID_RE.test(text)) {
    fail(label, 'uuid')
  }
  return text
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
  value: unknown,
  label: DomainLabel,
): string | null {
  if (value !== null && typeof value !== 'string') {
    fail(label, 'nullable_string')
  }
  return value
}

/** Comprueba que es un objeto y lo devuelve para leer sus campos uno a uno. */
export function assertObject(
  value: unknown,
  label: DomainLabel,
): Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    fail(label, 'object')
  }
  return value as Record<string, unknown>
}
