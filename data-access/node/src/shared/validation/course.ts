import { fail, type DomainLabel } from '../errors'
import type { Course, CourseCreate, CourseUpdate } from '../types/course'
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

export function assertCourseCreate(value: unknown): CourseCreate {
  return courseFields(value, false)
}

export function assertCourse(value: unknown): Course {
  return courseWithId(value, true)
}

export function assertCourseUpdate(value: unknown): CourseUpdate {
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

function courseWithId(value: unknown, allowEmptyLabels: boolean): Course {
  const course = assertObject(value, 'course')
  const id = assertUuid(course.id, 'course.id')
  return {
    id: normalizeUuid(id),
    ...courseFields(course, allowEmptyLabels),
  }
}

function courseFields(value: unknown, allowEmptyLabels: boolean): CourseCreate {
  const course = assertObject(value, 'course')
  const organizationId = assertUuid(
    course.organization_id,
    'course.organization_id',
  )
  const assertLabel = allowEmptyLabels ? assertString : assertNonEmptyString
  const name = assertLabel(course.name, 'course.name')
  const acronym = assertLabel(course.acronym, 'course.acronym')
  const startAtText = assertNonEmptyString(course.start_at, 'course.start_at')
  const endAtText = assertNonEmptyString(course.end_at, 'course.end_at')
  const contractAddress = assertNonEmptyString(
    course.contract_address,
    'course.contract_address',
  )
  assertContractAddress(contractAddress)
  const startAt = normalizeInstant(startAtText, 'course.start_at')
  const endAt = normalizeInstant(endAtText, 'course.end_at')
  if (!(endAt > startAt)) {
    fail('course.end_at', 'order')
  }
  return {
    organization_id: normalizeUuid(organizationId),
    name,
    acronym,
    start_at: startAt,
    end_at: endAt,
    contract_address: contractAddress,
  }
}
