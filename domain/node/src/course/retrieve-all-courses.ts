import { retrieveAllCourses as retrieveAllCourseRows } from '../postgres/executors/course'
import { assertCourse, type Course } from '../types/course'

export type RetrieveAllCoursesOutput = {
  courses: Course[]
}

export async function retrieveAllCourses(): Promise<RetrieveAllCoursesOutput> {
  const rows = await retrieveAllCourseRows()
  return { courses: rows.map((row) => assertCourse(row)) }
}
