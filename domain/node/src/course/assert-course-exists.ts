import { fail } from '../errors'
import { findCourseById } from '../postgres/executors/course'

export type AssertCourseExistsInput = {
  id: string
}

export async function assertCourseExists(
  input: AssertCourseExistsInput,
): Promise<void> {
  const course = await findCourseById(input.id)
  if (!course) {
    fail('course', 'missing')
  }
}
