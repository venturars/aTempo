import {
  assertCalendarDate,
  assertNonEmptyString,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

const CONTRACT_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const INSTANT_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/

export interface Course {
  id: string
  organization_id: string
  name: string
  acronym: string
  start_at: string
  end_at: string
  contract_address: string
}

export type CourseInput = Omit<Course, 'id'>

export function assertCourseInput(value: unknown): CourseInput {
  return courseFields(value, false)
}

export function assertCourse(value: unknown): Course {
  return courseWithId(value, true)
}

export function assertCourseUpdate(value: unknown): Course {
  return courseWithId(value, false)
}

export function assertContractAddress(value: string): void {
  if (!CONTRACT_ADDRESS_RE.test(value)) {
    throw new Error('course.contract_address debe ser 0x y 40 hex')
  }
}

export function normalizeContractAddress(value: string): string {
  return `0x${value.slice(2).toLowerCase()}`
}

function padUtc(value: number, width = 2): string {
  return String(value).padStart(width, '0')
}

export function normalizeInstant(value: string, label: string): string {
  const match = INSTANT_RE.exec(value)
  if (match === null) {
    throw new Error(`${label} debe ser una fecha con zona horaria`)
  }
  assertCalendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    label,
  )
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) {
    throw new Error(`${label} debe ser una fecha`)
  }

  const date = new Date(ms)
  const year = date.getUTCFullYear()
  if (year < 1 || year > 9999) {
    throw new Error(`${label} debe ser una fecha`)
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
    throw new Error('course.end_at debe ser posterior a course.start_at')
  }
}

function courseWithId(value: unknown, allowEmptyLabels: boolean): Course {
  if (value === null || typeof value !== 'object') {
    throw new Error('course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'course.id')
  return {
    id: normalizeUuid(row.id),
    ...courseFields(value, allowEmptyLabels),
  }
}

function courseFields(
  value: unknown,
  allowEmptyLabels: boolean,
): CourseInput {
  if (value === null || typeof value !== 'object') {
    throw new Error('course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.organization_id, 'course.organization_id')
  assertString(row.name, 'course.name', allowEmptyLabels)
  assertString(row.acronym, 'course.acronym', allowEmptyLabels)
  assertNonEmptyString(row.start_at, 'course.start_at')
  assertNonEmptyString(row.end_at, 'course.end_at')
  assertNonEmptyString(row.contract_address, 'course.contract_address')
  assertContractAddress(row.contract_address)
  const startAt = normalizeInstant(row.start_at, 'course.start_at')
  const endAt = normalizeInstant(row.end_at, 'course.end_at')
  if (!(endAt > startAt)) {
    throw new Error('course.end_at debe ser posterior a course.start_at')
  }
  return {
    organization_id: normalizeUuid(row.organization_id),
    name: row.name,
    acronym: row.acronym,
    start_at: startAt,
    end_at: endAt,
    contract_address: row.contract_address,
  }
}
