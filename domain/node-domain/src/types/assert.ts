const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertNonEmptyString(
  value: unknown,
  label: string,
): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} debe ser un string no vacío`)
  }
}

export function assertUuid(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label)
  if (!UUID_RE.test(value)) {
    throw new Error(`${label} debe ser un uuid`)
  }
}

export function assertNullableString(
  value: unknown,
  label: string,
): asserts value is string | null {
  if (value !== null && typeof value !== 'string') {
    throw new Error(`${label} debe ser string o null`)
  }
}
