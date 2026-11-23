import { deletePersonCourse } from '../postgres/repositories/person-course'
import { assertUuid } from '../types/assert'

export type RemovePersonCourseInput = {
  personId: string
  courseId: string
}

export type RemovePersonCourseOutput = {
  deleted: boolean
}

export async function removePersonCourse(
  input: RemovePersonCourseInput,
): Promise<RemovePersonCourseOutput> {
  const personId = assertUuid(input.personId, 'person_course.person_id')
  const courseId = assertUuid(input.courseId, 'person_course.course_id')
  const deleted = await deletePersonCourse(personId, courseId)
  return { deleted }
}
