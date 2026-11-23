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
  assertString(value.first_name, 'person.first_name', allowEmptyNames)
  assertString(value.last_name, 'person.last_name', allowEmptyNames)
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
