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
  assertString(value.name, 'course.name', allowEmptyLabels)
  assertString(value.acronym, 'course.acronym', allowEmptyLabels)
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
