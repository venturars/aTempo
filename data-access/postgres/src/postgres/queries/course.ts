import { COURSE_COLUMNS, COURSE_COLUMNS_FROM_COURSE } from '../columns'

export const LIST_COURSES = `SELECT
  ${COURSE_COLUMNS}
FROM course`

export const GET_COURSE_BY_ID = `SELECT
  ${COURSE_COLUMNS}
FROM course
WHERE id = $1::uuid`

export const LIST_COURSES_BY_PERSON = `SELECT
  ${COURSE_COLUMNS_FROM_COURSE}
FROM course
INNER JOIN person_course ON person_course.course_id = course.id
WHERE person_course.person_id = $1::uuid`

export const LIST_COURSES_BY_ORGANIZATION = `SELECT
  ${COURSE_COLUMNS}
FROM course
WHERE organization_id = $1::uuid`

export const FIND_COURSE_ID_BY_CONTRACT_ADDRESS = `SELECT id::text AS id
FROM course
WHERE lower(contract_address) = $1`

export const FIND_COURSE_ID_BY_ACRONYM = `SELECT id::text AS id
FROM course
WHERE organization_id = $1::uuid AND acronym = $2`

export const INSERT_COURSE = `INSERT INTO course (
  organization_id,
  name,
  acronym,
  start_at,
  end_at,
  contract_address
) VALUES ($1::uuid, $2, $3, $4, $5, $6)
RETURNING
  ${COURSE_COLUMNS}`

export const UPDATE_COURSE = `UPDATE course
SET
  organization_id = $2::uuid,
  name = $3,
  acronym = $4,
  start_at = $5,
  end_at = $6,
  contract_address = $7
WHERE id = $1::uuid
RETURNING
  ${COURSE_COLUMNS}`

export const DELETE_COURSE_ENROLLMENTS = `DELETE FROM person_course WHERE course_id = $1::uuid`

export const DELETE_COURSE = `DELETE FROM course WHERE id = $1::uuid
RETURNING
  ${COURSE_COLUMNS}`
