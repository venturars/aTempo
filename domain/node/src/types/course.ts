import { fail, type DomainLabel } from '../errors'
import {
  assertCalendarDate,
  assertNonEmptyString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

const CONTRACT_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const INSTANT_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/

export type Course = {
  id: string
  organization_id: string
  name: string
  acronym: string
  start_at: string
  end_at: string
  contract_address: string
}

export type CourseCreate = Omit<Course, 'id'>

export type CourseUpdate = Course

export function assertCourseCreate(value: CourseCreate): CourseCreate {
  return courseFields(value, false)
}

export function assertCourse(value: Course): Course {
  return courseWithId(value, true)
}

export function assertCourseUpdate(value: CourseUpdate): CourseUpdate {
  return courseWithId(value, false)
}

/**
 * Lee una fila de course que viene de PostgreSQL. El esquema ya garantiza
 * `end_at > start_at` y `to_char` ya da las fechas en ISO UTC, así que solo se
 * comprueba la forma. Una fecha que la entrada no aceptaría (un año de cinco
 * cifras) no rompe el listado entero.
 */
export function courseFromRow(row: Course): Course {
  assertObject(row, 'course')
  assertUuid(row.id, 'course.id')
  assertUuid(row.organization_id, 'course.organization_id')
  assertString(row.name, 'course.name')
  assertString(row.acronym, 'course.acronym')
  assertNonEmptyString(row.start_at, 'course.start_at')
  assertNonEmptyString(row.end_at, 'course.end_at')
  assertNonEmptyString(row.contract_address, 'course.contract_address')
  return {
    id: normalizeUuid(row.id),
    organization_id: normalizeUuid(row.organization_id),
    name: row.name,
    acronym: row.acronym,
    start_at: row.start_at,
    end_at: row.end_at,
    contract_address: row.contract_address,
  }
}

export function assertContractAddress(value: string): void {
  if (!CONTRACT_ADDRESS_RE.test(value)) {
    fail('course.contract_address', 'format')
  }
}

export function normalizeContractAddress(value: string): string {
  return `0x${value.slice(2).toLowerCase()}`
}

function padUtc(value: number, width = 2): string {
  return String(value).padStart(width, '0')
}

export function normalizeInstant(value: string, label: DomainLabel): string {
  const match = INSTANT_RE.exec(value)
  if (match === null) {
    fail(label, 'instant')
  }
  assertCalendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    label,
  )
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) {
    fail(label, 'date')
  }

  const date = new Date(ms)
  const year = date.getUTCFullYear()
  if (year < 1 || year > 9999) {
    fail(label, 'date')
  }

  return (
    `${padUtc(year, 4)}-${padUtc(date.getUTCMonth() + 1)}-${padUtc(date.getUTCDate())}` +
    `T${padUtc(date.getUTCHours())}:${padUtc(date.getUTCMinutes())}:${padUtc(date.getUTCSeconds())}` +
    `.${padUtc(date.getUTCMilliseconds(), 3)}Z`
  )
}

export function assertCourseDates(startAt: string, endAt: string): void {
  const start = normalizeInstant(startAt, 'course.start_at')
  const end = normalizeInstant(endAt, 'course.end_at')
  if (!(end > start)) {
    fail('course.end_at', 'order')
  }
}

function courseWithId(value: Course, allowEmptyLabels: boolean): Course {
  assertObject(value, 'course')
  assertUuid(value.id, 'course.id')
  return {
    id: normalizeUuid(value.id),
    ...courseFields(value, allowEmptyLabels),
  }
}

function courseFields(
  value: CourseCreate,
  allowEmptyLabels: boolean,
): CourseCreate {
  assertObject(value, 'course')
  assertUuid(value.organization_id, 'course.organization_id')
  const assertLabel = allowEmptyLabels ? assertString : assertNonEmptyString
  assertLabel(value.name, 'course.name')
  assertLabel(value.acronym, 'course.acronym')
  assertNonEmptyString(value.start_at, 'course.start_at')
  assertNonEmptyString(value.end_at, 'course.end_at')
  assertNonEmptyString(value.contract_address, 'course.contract_address')
  assertContractAddress(value.contract_address)
  const startAt = normalizeInstant(value.start_at, 'course.start_at')
  const endAt = normalizeInstant(value.end_at, 'course.end_at')
  if (!(endAt > startAt)) {
    fail('course.end_at', 'order')
  }
  return {
    organization_id: normalizeUuid(value.organization_id),
    name: value.name,
    acronym: value.acronym,
    start_at: startAt,
    end_at: endAt,
    contract_address: value.contract_address,
  }
}
