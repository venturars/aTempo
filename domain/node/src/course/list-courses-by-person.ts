import { listCoursesByPersonId } from '../postgres/repositories/course'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

export type ListCoursesByPersonInput = {
  personId: string
}

export type ListCoursesByPersonOutput = {
  courses: Course[]
}

export async function listCoursesByPerson(
  input: ListCoursesByPersonInput,
): Promise<ListCoursesByPersonOutput> {
  const personId = assertUuid(input.personId, 'person.id')
  const rows = await listCoursesByPersonId(personId)
  return { courses: rows.map((row) => assertCourse(row)) }
}
