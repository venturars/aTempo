import type { PersonCourse } from '../types/person-course'
import { assertObject, assertUuid, normalizeUuid } from './assert'

export function assertPersonCourse(value: unknown): PersonCourse {
  const personCourse = assertObject(value, 'person_course')
  const personId = assertUuid(personCourse.person_id, 'person_course.person_id')
  const courseId = assertUuid(personCourse.course_id, 'person_course.course_id')
  return {
    person_id: normalizeUuid(personId),
    course_id: normalizeUuid(courseId),
  }
}
