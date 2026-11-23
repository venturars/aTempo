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

export function assertBytes(value: Uint8Array, label: string): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new ValidationError(`${label} debe ser bytes`, {
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
