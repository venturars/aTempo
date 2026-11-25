import { deregisterPersonCourse as deregisterPersonCourseRow } from '../postgres/executors/person-course'
import { assertUuid } from '../types/assert'

export type DeregisterPersonCourseInput = {
  personId: string
  courseId: string
}

export type DeregisterPersonCourseOutput = {
  deleted: boolean
}

export async function deregisterPersonCourse(
  input: DeregisterPersonCourseInput,
): Promise<DeregisterPersonCourseOutput> {
  const personId = assertUuid(input.personId, 'person_course.person_id')
  const courseId = assertUuid(input.courseId, 'person_course.course_id')
  const deleted = await deregisterPersonCourseRow(personId, courseId)
  return { deleted }
}
