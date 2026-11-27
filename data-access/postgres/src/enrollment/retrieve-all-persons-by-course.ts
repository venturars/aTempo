import { retrieveAllPersonsByCourseId } from '../postgres/executors/person'
import { assertUuid } from '../shared/validation/assert'
import { personFromRow } from '../postgres/rows/person'
import type { Person } from '../shared/types/person'

export type RetrieveAllPersonsByCourseInput = {
  courseId: string
}

export type RetrieveAllPersonsByCourseOutput = {
  persons: Person[]
}

export async function retrieveAllPersonsByCourse(
  input: RetrieveAllPersonsByCourseInput,
): Promise<RetrieveAllPersonsByCourseOutput> {
  const courseId = assertUuid(input.courseId, 'course.id')
  const rows = await retrieveAllPersonsByCourseId(courseId)
  return { persons: rows.map((row) => personFromRow(row)) }
}
