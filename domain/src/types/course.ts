import { assertNonEmptyString, assertUuid } from './assert'

const CONTRACT_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

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

export function assertCourseInput(value: unknown): asserts value is CourseInput {
  if (value === null || typeof value !== 'object') {
    throw new Error('course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.organization_id, 'course.organization_id')
  assertNonEmptyString(row.name, 'course.name')
  assertNonEmptyString(row.acronym, 'course.acronym')
  assertNonEmptyString(row.start_at, 'course.start_at')
  assertNonEmptyString(row.end_at, 'course.end_at')
  assertNonEmptyString(row.contract_address, 'course.contract_address')
  assertContractAddress(row.contract_address)
  assertCourseDates(row.start_at, row.end_at)
}

export function assertContractAddress(value: string): void {
  if (!CONTRACT_ADDRESS_RE.test(value)) {
    throw new Error('course.contract_address debe ser 0x y 40 hex')
  }
}

export function assertCourseDates(startAt: string, endAt: string): void {
  const start = Date.parse(startAt)
  const end = Date.parse(endAt)
  if (Number.isNaN(start)) {
    throw new Error('course.start_at debe ser una fecha')
  }
  if (Number.isNaN(end)) {
    throw new Error('course.end_at debe ser una fecha')
  }
  if (!(end > start)) {
    throw new Error('course.end_at debe ser posterior a course.start_at')
  }
}

export function assertCourse(value: unknown): asserts value is Course {
  if (value === null || typeof value !== 'object') {
    throw new Error('course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'course.id')
  assertCourseInput(value)
}
