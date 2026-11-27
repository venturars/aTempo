import { fail, type ErrorLabel } from '../errors'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Comprueba que es un string. Acepta el string vacío. */
export function assertString(value: string, label: ErrorLabel): string {
  if (typeof value !== 'string') {
    fail(label, 'string')
  }
  return value
}

/** Comprueba que es un string con al menos un carácter. */
export function assertNonEmptyString(value: string, label: ErrorLabel): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail(label, 'empty')
  }
  return value
}

export function assertUuid(value: string, label: ErrorLabel): string {
  assertNonEmptyString(value, label)
  if (!UUID_RE.test(value)) {
    fail(label, 'uuid')
  }
  return value
}

export function normalizeUuid(value: string): string {
  return value.toLowerCase()
}

export function assertBytes(value: Uint8Array, label: ErrorLabel): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    fail(label, 'bytes')
  }
  return value
}

export function assertObject<T extends object>(value: T, label: ErrorLabel): T {
  if (value === null || typeof value !== 'object') {
    fail(label, 'object')
  }
  return value
}
