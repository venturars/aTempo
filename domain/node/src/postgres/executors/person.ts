import type { Person, PersonCreate, PersonUpdate } from '../../types/person'
import type { RoleName } from '../../types/role'
import {
  DELETE_PERSON,
  DELETE_PERSON_COURSES,
  DELETE_PERSON_ROLES,
  FIND_PERSON_ID_BY_EMAIL,
  FIND_PERSON_ID_BY_IDENTIFICATION_DOCUMENT,
  GET_PERSON_BY_ID,
  INSERT_PERSON,
  LIST_PERSONS,
  LIST_PERSONS_BY_COURSE,
  LIST_PERSONS_BY_ROLE,
  UPDATE_PERSON,
} from '../queries/person'
import { query, type PostgresQuery } from '../pool'
import type { IdRow } from './id-row'

export async function listPersons(run: PostgresQuery = query): Promise<Person[]> {
  const result = await run(LIST_PERSONS)
  return result.rows as Person[]
}

export async function findPersonById(
  id: string,
  run: PostgresQuery = query,
): Promise<Person | null> {
  const result = await run(GET_PERSON_BY_ID, [id])
  return (result.rows[0] as Person | undefined) ?? null
}

export async function listPersonsByCourseId(
  courseId: string,
  run: PostgresQuery = query,
): Promise<Person[]> {
  const result = await run(LIST_PERSONS_BY_COURSE, [courseId])
  return result.rows as Person[]
}

export async function listPersonsByRoleName(
  roleName: RoleName,
  run: PostgresQuery = query,
): Promise<Person[]> {
  const result = await run(LIST_PERSONS_BY_ROLE, [roleName])
  return result.rows as Person[]
}

export async function findPersonIdByEmail(
  email: string,
  run: PostgresQuery = query,
): Promise<string | null> {
  const result = await run(FIND_PERSON_ID_BY_EMAIL, [email])
  const row = result.rows[0] as IdRow | undefined
  return row?.id ?? null
}

export async function findPersonIdByIdentificationDocument(
  identificationDocument: string,
  run: PostgresQuery = query,
): Promise<string | null> {
  const result = await run(FIND_PERSON_ID_BY_IDENTIFICATION_DOCUMENT, [
    identificationDocument,
  ])
  const row = result.rows[0] as IdRow | undefined
  return row?.id ?? null
}

export async function insertPerson(
  person: PersonCreate,
  run: PostgresQuery = query,
): Promise<Person | null> {
  const result = await run(INSERT_PERSON, [
    person.identification_document,
    person.email,
    person.first_name,
    person.last_name,
    person.birth_date,
    person.phone,
  ])
  return (result.rows[0] as Person | undefined) ?? null
}

export async function updatePersonRow(
  person: PersonUpdate,
  run: PostgresQuery = query,
): Promise<Person | null> {
  const result = await run(UPDATE_PERSON, [
    person.id,
    person.identification_document,
    person.email,
    person.first_name,
    person.last_name,
    person.birth_date,
    person.phone,
  ])
  return (result.rows[0] as Person | undefined) ?? null
}

export async function deletePersonRoles(
  id: string,
  run: PostgresQuery = query,
): Promise<void> {
  await run(DELETE_PERSON_ROLES, [id])
}

export async function deletePersonCourses(
  id: string,
  run: PostgresQuery = query,
): Promise<void> {
  await run(DELETE_PERSON_COURSES, [id])
}

export async function deletePersonById(
  id: string,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(DELETE_PERSON, [id])
  return (result.rowCount ?? 0) > 0
}
