import { NotFoundError } from '../errors'
import { findCourseById } from '../postgres/repositories/course'

export type AssertCourseExistsInput = {
  id: string
}

export async function assertCourseExists(
  input: AssertCourseExistsInput,
): Promise<void> {
  const course = await findCourseById(input.id)
  if (!course) {
    throw new NotFoundError('course no existe', { entity: 'course' })
  }
}
