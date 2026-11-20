function personColumns(table?: string): string {
  const col = (name: string) => (table ? `${table}.${name}` : name)
  return `${col('id')}::text AS id,
  ${col('identification_document')},
  ${col('email')},
  ${col('first_name')},
  ${col('last_name')},
  to_char(${col('birth_date')}, 'YYYY-MM-DD') AS birth_date,
  ${col('phone')}`
}

function courseColumns(table?: string): string {
  const col = (name: string) => (table ? `${table}.${name}` : name)
  return `${col('id')}::text AS id,
  ${col('organization_id')}::text AS organization_id,
  ${col('name')},
  ${col('acronym')},
  to_char(${col('start_at')} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS start_at,
  to_char(${col('end_at')} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS end_at,
  ${col('contract_address')}`
}

export const ORGANIZATION_COLUMNS = `id::text AS id,
  name,
  tax_id`

export const PERSON_COLUMNS = personColumns()

export const PERSON_COLUMNS_FROM_PERSON = personColumns('person')

export const COURSE_COLUMNS = courseColumns()

export const COURSE_COLUMNS_FROM_COURSE = courseColumns('course')
