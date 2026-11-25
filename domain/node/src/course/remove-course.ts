import { withTransaction } from '../postgres/pool'
import {
  removeCourseById,
  removeCourseEnrollments,
} from '../postgres/executors/course'
import { assertUuid } from '../types/assert'

export type RemoveCourseInput = {
  id: string
}

export type RemoveCourseOutput = {
  deleted: boolean
}

export async function removeCourse(
  input: RemoveCourseInput,
): Promise<RemoveCourseOutput> {
  const id = assertUuid(input.id, 'course.id')

  const deleted = await withTransaction(async (run) => {
    await removeCourseEnrollments(id, run)
    return removeCourseById(id, run)
  })

  return { deleted }
}
