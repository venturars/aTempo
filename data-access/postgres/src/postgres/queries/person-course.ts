export const LOOKUP_PERSON_COURSE = `SELECT
  EXISTS (SELECT 1 FROM person WHERE id = $1::uuid) AS person_exists,
  EXISTS (SELECT 1 FROM course WHERE id = $2::uuid) AS course_exists,
  EXISTS (
    SELECT 1 FROM person_course
    WHERE person_id = $1::uuid AND course_id = $2::uuid
  ) AS already,
  EXISTS (
    SELECT 1 FROM person_role
    WHERE person_id = $1::uuid AND role IN ('student', 'teacher')
  ) AS has_course_role`

export const INSERT_PERSON_COURSE = `INSERT INTO person_course (person_id, course_id)
VALUES ($1::uuid, $2::uuid)
RETURNING person_id::text AS person_id, course_id::text AS course_id`

export const DELETE_PERSON_COURSE = `DELETE FROM person_course
WHERE person_id = $1::uuid AND course_id = $2::uuid
RETURNING person_id::text AS person_id, course_id::text AS course_id`

export const PERSON_HAS_COURSES = `SELECT EXISTS (
  SELECT 1 FROM person_course WHERE person_id = $1::uuid
) AS has_courses`
