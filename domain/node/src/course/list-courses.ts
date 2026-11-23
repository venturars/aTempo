import { listCourses as listCourseRows } from '../postgres/repositories/course'
import { assertCourse, type Course } from '../types/course'

export type ListCoursesOutput = {
  courses: Course[]
}

export async function listCourses(): Promise<ListCoursesOutput> {
  const rows = await listCourseRows()
  return { courses: rows.map((row) => assertCourse(row)) }
}
