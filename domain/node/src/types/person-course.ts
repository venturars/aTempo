import { assertObject, assertUuid, normalizeUuid } from './assert'

export type PersonCourse = {
  person_id: string
  course_id: string
}

export function assertPersonCourse(value: unknown): PersonCourse {
  const personCourse = assertObject(value, 'person_course')
  const personId = assertUuid(personCourse.person_id, 'person_course.person_id')
  const courseId = assertUuid(personCourse.course_id, 'person_course.course_id')
  return {
    person_id: normalizeUuid(personId),
    course_id: normalizeUuid(courseId),
  }
}
