import { fail } from '../errors'
import {
  assertCalendarDate,
  assertNonEmptyString,
  assertNullableString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

export type Person = {
  id: string
  identification_document: string
  email: string
  first_name: string
  last_name: string
  birth_date: string | null
  phone: string | null
}

export type PersonCreate = Omit<Person, 'id'>

export type PersonUpdate = Person

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
    fail('person.birth_date', 'date')
  }

  assertCalendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    'person.birth_date',
  )
}

export function assertPersonCreate(value: PersonCreate): PersonCreate {
  return personFields(value, false)
}

export function assertPerson(value: Person): Person {
  return personWithId(value, true)
}

export function assertPersonUpdate(value: PersonUpdate): PersonUpdate {
  return personWithId(value, false)
}

/**
 * Lee una fila de person que viene de PostgreSQL. Solo se comprueba la forma:
 * un valor guardado que la entrada no aceptaría (un `birth_date` con un año de
 * cinco cifras, un documento vacío) no rompe el listado entero.
 */
export function personFromRow(row: Person): Person {
  assertObject(row, 'person')
  assertUuid(row.id, 'person.id')
  assertString(row.identification_document, 'person.identification_document')
  assertString(row.email, 'person.email')
  assertString(row.first_name, 'person.first_name')
  assertString(row.last_name, 'person.last_name')
  assertNullableString(row.birth_date, 'person.birth_date')
  assertNullableString(row.phone, 'person.phone')
  return {
    id: normalizeUuid(row.id),
    identification_document: row.identification_document,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    birth_date: row.birth_date,
    phone: row.phone,
  }
}

function personWithId(value: Person, allowEmptyNames: boolean): Person {
  assertObject(value, 'person')
  assertUuid(value.id, 'person.id')
  return {
    id: normalizeUuid(value.id),
    ...personFields(value, allowEmptyNames),
  }
}

function personFields(
  value: PersonCreate,
  allowEmptyNames: boolean,
): PersonCreate {
  assertObject(value, 'person')
  assertNonEmptyString(
    value.identification_document,
    'person.identification_document',
  )
  assertNonEmptyString(value.email, 'person.email')
  if (normalizeEmail(value.email).length === 0) {
    fail('person.email', 'empty')
  }
  const assertName = allowEmptyNames ? assertString : assertNonEmptyString
  assertName(value.first_name, 'person.first_name')
  assertName(value.last_name, 'person.last_name')
  assertNullableString(value.birth_date, 'person.birth_date')
  assertBirthDate(value.birth_date)
  assertNullableString(value.phone, 'person.phone')
  return {
    identification_document: value.identification_document,
    email: value.email,
    first_name: value.first_name,
    last_name: value.last_name,
    birth_date: value.birth_date,
    phone: value.phone,
  }
}
