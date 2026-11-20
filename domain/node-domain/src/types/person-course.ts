import { assertUuid, normalizeUuid } from './assert'

export interface PersonCourse {
  person_id: string
  course_id: string
}

export function assertPersonCourse(value: unknown): PersonCourse {
  if (value === null || typeof value !== 'object') {
    throw new Error('person_course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.person_id, 'person_course.person_id')
  assertUuid(row.course_id, 'person_course.course_id')
  return {
    person_id: normalizeUuid(row.person_id),
    course_id: normalizeUuid(row.course_id),
  }
}
