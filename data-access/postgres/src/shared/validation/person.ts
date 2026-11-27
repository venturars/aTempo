import { fail } from '../errors'
import type {
  Person,
  PersonCreate,
  PersonUpdate,
  PersonChanges,
} from '../types/person'
import {
  assertChanges,
  assertCalendarDate,
  assertNonEmptyString,
  assertNullableString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

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

const PERSON_CHANGEABLE_FIELDS = [
  'identification_document',
  'email',
  'first_name',
  'last_name',
  'birth_date',
  'phone',
] as const

/**
 * Solo comprueba la forma de los cambios. Sus valores se validan con
 * `assertPersonUpdate` al mezclarlos con la fila guardada.
 */
export function assertPersonChanges(value: unknown): PersonChanges {
  return assertChanges(
    value,
    'person',
    PERSON_CHANGEABLE_FIELDS,
  ) as PersonChanges
}

export function assertPersonUpdate(value: unknown): PersonUpdate {
  return personWithId(value, false)
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
