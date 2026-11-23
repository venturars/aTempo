import { listPersonsByCourseId } from '../postgres/executors/person'
import { assertUuid } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

export type ListPersonsByCourseInput = {
  courseId: string
}

export type ListPersonsByCourseOutput = {
  persons: Person[]
}

export async function listPersonsByCourse(
  input: ListPersonsByCourseInput,
): Promise<ListPersonsByCourseOutput> {
  const courseId = assertUuid(input.courseId, 'course.id')
  const rows = await listPersonsByCourseId(courseId)
  return { persons: rows.map((row) => assertPerson(row)) }
}
