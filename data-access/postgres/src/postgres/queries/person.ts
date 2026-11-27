import { PERSON_COLUMNS, PERSON_COLUMNS_FROM_PERSON } from '../columns'

export const LIST_PERSONS = `SELECT
  ${PERSON_COLUMNS}
FROM person`

export const GET_PERSON_BY_ID = `SELECT
  ${PERSON_COLUMNS}
FROM person
WHERE id = $1::uuid`

export const LIST_PERSONS_BY_COURSE = `SELECT
  ${PERSON_COLUMNS_FROM_PERSON}
FROM person
INNER JOIN person_course ON person_course.person_id = person.id
WHERE person_course.course_id = $1::uuid`

export const LIST_PERSONS_BY_ROLE = `SELECT
  ${PERSON_COLUMNS_FROM_PERSON}
FROM person
INNER JOIN person_role ON person_role.person_id = person.id
WHERE person_role.role = $1`

export const FIND_PERSON_ID_BY_EMAIL = `SELECT id::text AS id
FROM person
WHERE lower(email) = $1`

export const FIND_PERSON_ID_BY_IDENTIFICATION_DOCUMENT = `SELECT id::text AS id
FROM person
WHERE lower(identification_document) = $1`

export const INSERT_PERSON = `INSERT INTO person (
  identification_document,
  email,
  first_name,
  last_name,
  birth_date,
  phone
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
  ${PERSON_COLUMNS}`

export const UPDATE_PERSON = `UPDATE person
SET
  identification_document = $2,
  email = $3,
  first_name = $4,
  last_name = $5,
  birth_date = $6,
  phone = $7
WHERE id = $1::uuid
RETURNING
  ${PERSON_COLUMNS}`

export const DELETE_PERSON_ROLES = `DELETE FROM person_role WHERE person_id = $1::uuid`

export const DELETE_PERSON_COURSES = `DELETE FROM person_course WHERE person_id = $1::uuid`

export const DELETE_PERSON = `DELETE FROM person WHERE id = $1::uuid
RETURNING
  ${PERSON_COLUMNS}`
