import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  ${COURSE_COLUMNS}
FROM course`

export async function listCourses(): Promise<Course[]> {
  const result = await query<Course>(SELECT)
  return result.rows.map((row) => assertCourse(row))
}
