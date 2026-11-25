import { fail } from '../errors'
import { findCourseById } from '../postgres/executors/course'

export type FindCourseExistsInput = {
  id: string
}

export async function findCourseExists(
  input: FindCourseExistsInput,
): Promise<void> {
  const course = await findCourseById(input.id)
  if (!course) {
    fail('course', 'missing')
  }
}
