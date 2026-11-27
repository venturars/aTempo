import { ORGANIZATION_COLUMNS } from '../columns'

export const LIST_ORGANIZATIONS = `SELECT
  ${ORGANIZATION_COLUMNS}
FROM organization`

export const GET_ORGANIZATION_BY_ID = `SELECT
  ${ORGANIZATION_COLUMNS}
FROM organization
WHERE id = $1::uuid`

export const FIND_ORGANIZATION_ID_BY_TAX_ID = `SELECT id::text AS id
FROM organization
WHERE lower(tax_id) = $1`

export const INSERT_ORGANIZATION = `INSERT INTO organization (name, tax_id)
VALUES ($1, $2)
RETURNING
  ${ORGANIZATION_COLUMNS}`

export const UPDATE_ORGANIZATION = `UPDATE organization
SET name = $2, tax_id = $3
WHERE id = $1::uuid
RETURNING
  ${ORGANIZATION_COLUMNS}`

export const DELETE_ORGANIZATION_ENROLLMENTS = `DELETE FROM person_course
WHERE course_id IN (SELECT id FROM course WHERE organization_id = $1::uuid)`

export const DELETE_ORGANIZATION_COURSES = `DELETE FROM course WHERE organization_id = $1::uuid`

export const DELETE_ORGANIZATION = `DELETE FROM organization WHERE id = $1::uuid`
