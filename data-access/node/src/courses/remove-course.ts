import { withTransaction } from '../postgres/pool'
import {
  removeCourseById,
  removeCourseEnrollments,
} from '../postgres/executors/course'
import { courseFromRow } from '../postgres/rows/course'
import { assertUuid } from '../shared/validation/assert'
import type { Course } from '../shared/types/course'

export type RemoveCourseInput = {
  id: string
}

export type RemoveCourseOutput = {
  course: Course
}

/**
 * Borra un curso con sus matrículas y devuelve el curso borrado. Lanza
 * `course.missing` si no existe.
 */
export async function removeCourse(
  input: RemoveCourseInput,
): Promise<RemoveCourseOutput> {
  const id = assertUuid(input.id, 'course.id')

  const removed = await withTransaction(async (run) => {
    await removeCourseEnrollments(id, run)
    return removeCourseById(id, run)
  })

  return { course: courseFromRow(removed) }
}
