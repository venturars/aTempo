import type { PersonCourse } from '../../shared/types/person-course'
import {
  DELETE_PERSON_COURSE,
  INSERT_PERSON_COURSE,
  LOOKUP_PERSON_COURSE,
  PERSON_HAS_COURSES,
} from '../queries/person-course'
import { query, type PostgresQuery } from '../pool'
import { requireRow } from './require-row'

export type PersonCourseLookup = {
  person_exists: boolean
  course_exists: boolean
  already: boolean
  /** La persona es student o teacher: los únicos roles que van a un curso. */
  has_course_role: boolean
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
): Promise<PersonCourse> {
  const result = await run(INSERT_PERSON_COURSE, [
    personCourse.person_id,
    personCourse.course_id,
  ])
  return requireRow<PersonCourse>(result, 'person_course', 'not_created')
}

export async function personHasCourses(
  personId: string,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(PERSON_HAS_COURSES, [personId])
  const row = result.rows[0] as { has_courses: boolean } | undefined
  return row?.has_courses === true
}

export async function removePersonCourseRow(
  personId: string,
  courseId: string,
  run: PostgresQuery = query,
): Promise<PersonCourse> {
  const result = await run(DELETE_PERSON_COURSE, [personId, courseId])
  return requireRow<PersonCourse>(result, 'person_course', 'missing')
}
