import { assertUuid, normalizeUuid } from './assert'

export interface PersonCourse {
  person_id: string
  course_id: string
}

export function assertPersonCourse(
  value: unknown,
): asserts value is PersonCourse {
  if (value === null || typeof value !== 'object') {
    throw new Error('person_course debe ser un objeto')
  }

  const row = value as Record<string, unknown>
  assertUuid(row.person_id, 'person_course.person_id')
  row.person_id = normalizeUuid(row.person_id)
  assertUuid(row.course_id, 'person_course.course_id')
  row.course_id = normalizeUuid(row.course_id)
}
