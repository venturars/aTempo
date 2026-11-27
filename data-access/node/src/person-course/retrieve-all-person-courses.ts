import { retrieveAllPersonCourseRows } from '../postgres/executors/person-course'
import { assertPersonCourse } from '../shared/validation/person-course'
import type { PersonCourse } from '../shared/types/person-course'

export type RetrieveAllPersonCoursesOutput = {
  personCourses: PersonCourse[]
}

export async function retrieveAllPersonCourses(): Promise<RetrieveAllPersonCoursesOutput> {
  const rows = await retrieveAllPersonCourseRows()
  return { personCourses: rows.map((row) => assertPersonCourse(row)) }
}
