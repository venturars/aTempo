export const ORGANIZATION_COLUMNS = `id::text AS id,
  name,
  tax_id`

export const PERSON_COLUMNS = `id::text AS id,
  identification_document,
  email,
  first_name,
  last_name,
  to_char(birth_date, 'YYYY-MM-DD') AS birth_date,
  phone`

export const PERSON_COLUMNS_FROM_PERSON = `person.id::text AS id,
  person.identification_document,
  person.email,
  person.first_name,
  person.last_name,
  to_char(person.birth_date, 'YYYY-MM-DD') AS birth_date,
  person.phone`

export const COURSE_COLUMNS = `id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  to_char(start_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS start_at,
  to_char(end_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS end_at,
  contract_address`

export const COURSE_COLUMNS_FROM_COURSE = `course.id::text AS id,
  course.organization_id::text AS organization_id,
  course.name,
  course.acronym,
  to_char(course.start_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS start_at,
  to_char(course.end_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS end_at,
  course.contract_address`
