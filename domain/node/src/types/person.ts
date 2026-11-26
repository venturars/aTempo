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

export function assertPersonCreate(value: unknown): PersonCreate {
  return personFields(value, false)
}

export function assertPerson(value: unknown): Person {
  return personWithId(value, true)
}

export function assertPersonUpdate(value: unknown): PersonUpdate {
  return personWithId(value, false)
}

/**
 * Lee una fila de person que viene de PostgreSQL. Solo se comprueba la forma:
 * un valor guardado que la entrada no aceptaría (un `birth_date` con un año de
 * cinco cifras, un documento vacío) no rompe el listado entero.
 */
export function personFromRow(value: unknown): Person {
  const row = assertObject(value, 'person')
  const id = assertUuid(row.id, 'person.id')
  return {
    id: normalizeUuid(id),
    identification_document: assertString(
      row.identification_document,
      'person.identification_document',
    ),
    email: assertString(row.email, 'person.email'),
    first_name: assertString(row.first_name, 'person.first_name'),
    last_name: assertString(row.last_name, 'person.last_name'),
    birth_date: assertNullableString(row.birth_date, 'person.birth_date'),
    phone: assertNullableString(row.phone, 'person.phone'),
  }
}

function personWithId(value: unknown, allowEmptyNames: boolean): Person {
  const person = assertObject(value, 'person')
  const id = assertUuid(person.id, 'person.id')
  return {
    id: normalizeUuid(id),
    ...personFields(person, allowEmptyNames),
  }
}

function personFields(value: unknown, allowEmptyNames: boolean): PersonCreate {
  const person = assertObject(value, 'person')
  const identificationDocument = assertNonEmptyString(
    person.identification_document,
    'person.identification_document',
  )
  const email = assertNonEmptyString(person.email, 'person.email')
  if (normalizeEmail(email).length === 0) {
    fail('person.email', 'empty')
  }
  const assertName = allowEmptyNames ? assertString : assertNonEmptyString
  const firstName = assertName(person.first_name, 'person.first_name')
  const lastName = assertName(person.last_name, 'person.last_name')
  const birthDate = assertNullableString(person.birth_date, 'person.birth_date')
  assertBirthDate(birthDate)
  const phone = assertNullableString(person.phone, 'person.phone')
  return {
    identification_document: identificationDocument,
    email,
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
    phone,
  }
}
