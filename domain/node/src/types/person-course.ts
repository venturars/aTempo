import { assertObject, assertUuid, normalizeUuid } from './assert'

export type PersonCourse = {
  person_id: string
  course_id: string
}

export function assertPersonCourse(value: PersonCourse): PersonCourse {
  assertObject(value, 'person_course')
  assertUuid(value.person_id, 'person_course.person_id')
  assertUuid(value.course_id, 'person_course.course_id')
  return {
    person_id: normalizeUuid(value.person_id),
    course_id: normalizeUuid(value.course_id),
  }
}
