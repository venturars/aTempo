import { query } from '../postgres/db'

const SELECT = `SELECT 1
FROM person_course
WHERE person_id = $1::uuid AND course_id = $2::uuid`

export async function assertPersonCourseAvailable(
  personId: string,
  courseId: string,
): Promise<void> {
  const result = await query(SELECT, [personId, courseId])
  if (result.rows[0]) {
    throw new Error('person_course ya existe')
  }
}
