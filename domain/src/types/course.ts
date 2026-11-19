import { assertNonEmptyString, assertUuid } from './assert'

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
}

export function assertCourse(value: unknown): asserts value is Course {
  if (value === null || typeof value !== 'object') {
    throw new Error('course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.id, 'course.id')
  assertCourseInput(value)
}
