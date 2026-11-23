import { findCourseById } from '../postgres/repositories/course'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

export type GetCourseByIdInput = {
  id: string
}

export type GetCourseByIdOutput = {
  course: Course | null
}

export async function getCourseById(
  input: GetCourseByIdInput,
): Promise<GetCourseByIdOutput> {
  const id = assertUuid(input.id, 'course.id')
  const row = await findCourseById(id)
  if (!row) {
    return { course: null }
  }

  return { course: assertCourse(row) }
}
