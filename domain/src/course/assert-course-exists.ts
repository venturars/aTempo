import { getCourseById } from './get-course-by-id'

export async function assertCourseExists(id: string): Promise<void> {
  const course = await getCourseById(id)
  if (!course) {
    throw new Error('course no existe')
  }
}
