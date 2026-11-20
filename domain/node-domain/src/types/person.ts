import {
  assertCalendarDate,
  assertNonEmptyString,
  assertNullableString,
  assertString,
  assertUuid,
  normalizeUuid,
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

const BIRTH_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function assertBirthDate(value: string | null): void {
  if (value === null) {
    return
  }

  const match = BIRTH_DATE_RE.exec(value)
  if (!match) {
    throw new Error('person.birth_date debe ser una fecha')
  }

  assertCalendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    'person.birth_date',
  )
}

export function assertPersonInput(value: unknown): PersonInput {
  return personFields(value, false)
}

export function assertPerson(value: unknown): Person {
  return personWithId(value, true)
}

export function assertPersonUpdate(value: unknown): Person {
  return personWithId(value, false)
}

function personWithId(value: unknown, allowEmptyNames: boolean): Person {
  if (value === null || typeof value !== 'object') {
    throw new Error('person debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'person.id')
  return {
    id: normalizeUuid(row.id),
    ...personFields(value, allowEmptyNames),
  }
}

function personFields(value: unknown, allowEmptyNames: boolean): PersonInput {
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
  assertString(row.first_name, 'person.first_name', allowEmptyNames)
  assertString(row.last_name, 'person.last_name', allowEmptyNames)
  assertNullableString(row.birth_date, 'person.birth_date')
  assertBirthDate(row.birth_date)
  assertNullableString(row.phone, 'person.phone')
  return {
    identification_document: row.identification_document,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    birth_date: row.birth_date,
    phone: row.phone,
  }
}
