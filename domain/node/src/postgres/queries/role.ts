export const LIST_ROLES = `SELECT name FROM role`

export const GET_ROLE_BY_NAME = `SELECT name FROM role WHERE name = $1`

export const LIST_ROLES_BY_PERSON = `SELECT role.name
FROM role
INNER JOIN person_role ON person_role.role = role.name
WHERE person_role.person_id = $1::uuid`
