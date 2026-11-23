import { listPersonCourses as listPersonCourseRows } from '../postgres/repositories/person-course'
import { assertPersonCourse, type PersonCourse } from '../types/person-course'

export type ListPersonCoursesOutput = {
  personCourses: PersonCourse[]
}

export async function listPersonCourses(): Promise<ListPersonCoursesOutput> {
  const rows = await listPersonCourseRows()
  return { personCourses: rows.map((row) => assertPersonCourse(row)) }
}
