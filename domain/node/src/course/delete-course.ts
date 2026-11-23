import { withTransaction } from '../postgres/pool'
import {
  deleteCourseById,
  deleteCourseEnrollments,
} from '../postgres/repositories/course'
import { assertUuid } from '../types/assert'

export type DeleteCourseInput = {
  id: string
}

export type DeleteCourseOutput = {
  deleted: boolean
}

export async function deleteCourse(
  input: DeleteCourseInput,
): Promise<DeleteCourseOutput> {
  const id = assertUuid(input.id, 'course.id')

  const deleted = await withTransaction(async (run) => {
    await deleteCourseEnrollments(id, run)
    return deleteCourseById(id, run)
  })

  return { deleted }
}
