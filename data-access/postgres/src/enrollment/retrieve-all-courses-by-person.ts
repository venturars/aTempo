import { retrieveAllCoursesByPersonId } from '../postgres/executors/course'
import { assertUuid } from '../shared/validation/assert'
import { courseFromRow } from '../postgres/rows/course'
import type { Course } from '../shared/types/course'

export type RetrieveAllCoursesByPersonInput = {
  personId: string
}

export type RetrieveAllCoursesByPersonOutput = {
  courses: Course[]
}

export async function retrieveAllCoursesByPerson(
  input: RetrieveAllCoursesByPersonInput,
): Promise<RetrieveAllCoursesByPersonOutput> {
  const personId = assertUuid(input.personId, 'person.id')
  const rows = await retrieveAllCoursesByPersonId(personId)
  return { courses: rows.map((row) => courseFromRow(row)) }
}
