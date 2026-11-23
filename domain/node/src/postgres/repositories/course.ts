import type { Course, CourseCreate, CourseUpdate } from '../../types/course'
import {
  DELETE_COURSE,
  DELETE_COURSE_ENROLLMENTS,
  FIND_COURSE_ID_BY_ACRONYM,
  FIND_COURSE_ID_BY_CONTRACT_ADDRESS,
  GET_COURSE_BY_ID,
  INSERT_COURSE,
  LIST_COURSES,
  LIST_COURSES_BY_ORGANIZATION,
  LIST_COURSES_BY_PERSON,
  UPDATE_COURSE,
} from '../queries/course'
import { query, type PostgresQuery } from '../pool'
import type { IdRow } from './id-row'

export async function listCourses(run: PostgresQuery = query): Promise<Course[]> {
  const result = await run(LIST_COURSES)
  return result.rows as Course[]
}

export async function findCourseById(
  id: string,
  run: PostgresQuery = query,
): Promise<Course | null> {
  const result = await run(GET_COURSE_BY_ID, [id])
  return (result.rows[0] as Course | undefined) ?? null
}

export async function listCoursesByPersonId(
  personId: string,
  run: PostgresQuery = query,
): Promise<Course[]> {
  const result = await run(LIST_COURSES_BY_PERSON, [personId])
  return result.rows as Course[]
}

export async function listCoursesByOrganizationId(
  organizationId: string,
  run: PostgresQuery = query,
): Promise<Course[]> {
  const result = await run(LIST_COURSES_BY_ORGANIZATION, [organizationId])
  return result.rows as Course[]
}

export async function findCourseIdByContractAddress(
  contractAddress: string,
  run: PostgresQuery = query,
): Promise<string | null> {
  const result = await run(FIND_COURSE_ID_BY_CONTRACT_ADDRESS, [
    contractAddress,
  ])
  const row = result.rows[0] as IdRow | undefined
  return row?.id ?? null
}

export async function findCourseIdByAcronym(
  organizationId: string,
  acronym: string,
  run: PostgresQuery = query,
): Promise<string | null> {
  const result = await run(FIND_COURSE_ID_BY_ACRONYM, [organizationId, acronym])
  const row = result.rows[0] as IdRow | undefined
  return row?.id ?? null
}

export async function insertCourse(
  course: CourseCreate,
  run: PostgresQuery = query,
): Promise<Course | null> {
  const result = await run(INSERT_COURSE, [
    course.organization_id,
    course.name,
    course.acronym,
    course.start_at,
    course.end_at,
    course.contract_address,
  ])
  return (result.rows[0] as Course | undefined) ?? null
}

export async function updateCourseRow(
  course: CourseUpdate,
  run: PostgresQuery = query,
): Promise<Course | null> {
  const result = await run(UPDATE_COURSE, [
    course.id,
    course.organization_id,
    course.name,
    course.acronym,
    course.start_at,
    course.end_at,
    course.contract_address,
  ])
  return (result.rows[0] as Course | undefined) ?? null
}

export async function deleteCourseEnrollments(
  id: string,
  run: PostgresQuery = query,
): Promise<void> {
  await run(DELETE_COURSE_ENROLLMENTS, [id])
}

export async function deleteCourseById(
  id: string,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(DELETE_COURSE, [id])
  return (result.rowCount ?? 0) > 0
}
