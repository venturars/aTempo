import { retrieveAllCourseRows } from '../postgres/executors/course'
import { courseFromRow, type Course } from '../types/course'

export type RetrieveAllCoursesOutput = {
  courses: Course[]
}

export async function retrieveAllCourses(): Promise<RetrieveAllCoursesOutput> {
  const rows = await retrieveAllCourseRows()
  return { courses: rows.map((row) => courseFromRow(row)) }
}
