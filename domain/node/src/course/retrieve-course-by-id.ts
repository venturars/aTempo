import { findCourseById } from '../postgres/executors/course'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

export type RetrieveCourseByIdInput = {
  id: string
}

export type RetrieveCourseByIdOutput = {
  course: Course | null
}

export async function retrieveCourseById(
  input: RetrieveCourseByIdInput,
): Promise<RetrieveCourseByIdOutput> {
  const id = assertUuid(input.id, 'course.id')
  const row = await findCourseById(id)
  if (!row) {
    return { course: null }
  }

  return { course: assertCourse(row) }
}
