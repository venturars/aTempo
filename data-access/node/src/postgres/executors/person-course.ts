import type { PersonCourse } from '../../shared/types/person-course'
import {
  DELETE_PERSON_COURSE,
  INSERT_PERSON_COURSE,
  LIST_PERSON_COURSES,
  LOOKUP_PERSON_COURSE,
} from '../queries/person-course'
import { query, type PostgresQuery } from '../pool'

export type PersonCourseLookup = {
  person_exists: boolean
  course_exists: boolean
  already: boolean
}

export async function retrieveAllPersonCourseRows(
  run: PostgresQuery = query,
): Promise<PersonCourse[]> {
  const result = await run(LIST_PERSON_COURSES)
  return result.rows as PersonCourse[]
}

export async function lookupPersonCourse(
  personCourse: PersonCourse,
  run: PostgresQuery = query,
): Promise<PersonCourseLookup | null> {
  const result = await run(LOOKUP_PERSON_COURSE, [
    personCourse.person_id,
    personCourse.course_id,
  ])
  return (result.rows[0] as PersonCourseLookup | undefined) ?? null
}

export async function addPersonCourseRow(
  personCourse: PersonCourse,
  run: PostgresQuery = query,
): Promise<PersonCourse | null> {
  const result = await run(INSERT_PERSON_COURSE, [
    personCourse.person_id,
    personCourse.course_id,
  ])
  return (result.rows[0] as PersonCourse | undefined) ?? null
}

export async function deregisterPersonCourseRow(
  personId: string,
  courseId: string,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(DELETE_PERSON_COURSE, [personId, courseId])
  return (result.rowCount ?? 0) > 0
}
