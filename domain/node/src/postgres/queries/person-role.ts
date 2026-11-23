export const LIST_PERSON_ROLES = `SELECT
  person_id::text AS person_id,
  role
FROM person_role`

export const FIND_PERSON_ROLE = `SELECT 1
FROM person_role
WHERE person_id = $1::uuid AND role = $2`

export const INSERT_PERSON_ROLE = `INSERT INTO person_role (person_id, role)
VALUES ($1::uuid, $2)
RETURNING person_id::text AS person_id, role`

export const DELETE_PERSON_ROLE = `DELETE FROM person_role
WHERE person_id = $1::uuid AND role = $2`
