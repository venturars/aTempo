import { retrieveAllCoursesByPersonId } from '../postgres/executors/course'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

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
  return { courses: rows.map((row) => assertCourse(row)) }
}
