import {
  assertNonEmptyString,
  assertNullableString,
  assertUuid,
} from './assert'

export interface Person {
  id: string
  identification_document: string
  email: string
  first_name: string
  last_name: string
  birth_date: string | null
  phone: string | null
}

export type PersonInput = Omit<Person, 'id'>

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function assertPersonInput(value: unknown): asserts value is PersonInput {
  if (value === null || typeof value !== 'object') {
    throw new Error('person debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertNonEmptyString(
    row.identification_document,
    'person.identification_document',
  )
  assertNonEmptyString(row.email, 'person.email')
  if (normalizeEmail(row.email).length === 0) {
    throw new Error('person.email debe ser un string no vacío')
  }
  assertNonEmptyString(row.first_name, 'person.first_name')
  assertNonEmptyString(row.last_name, 'person.last_name')
  assertNullableString(row.birth_date, 'person.birth_date')
  assertNullableString(row.phone, 'person.phone')
}

export function assertPerson(value: unknown): asserts value is Person {
  if (value === null || typeof value !== 'object') {
    throw new Error('person debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'person.id')
  assertPersonInput(value)
}
