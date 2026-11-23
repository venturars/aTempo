import { fail } from '../errors'
import { withTransaction } from '../postgres/pool'
import {
  insertPersonCourse,
  lookupPersonCourse,
} from '../postgres/executors/person-course'
import {
  assertPersonCourse,
  type PersonCourse,
} from '../types/person-course'

export type AddPersonCourseInput = {
  personCourse: PersonCourse
}

export type AddPersonCourseOutput = {
  personCourse: PersonCourse
}

export async function addPersonCourse(
  input: AddPersonCourseInput,
): Promise<AddPersonCourseOutput> {
  const personCourse = assertPersonCourse(input.personCourse)

  const created = await withTransaction(async (run) => {
    const lookup = await lookupPersonCourse(personCourse, run)
    if (!lookup?.person_exists) {
      fail('person', 'missing')
    }
    if (!lookup.course_exists) {
      fail('course', 'missing')
    }
    if (lookup.already) {
      fail('person_course', 'taken')
    }

    const row = await insertPersonCourse(personCourse, run)
    if (!row) {
      fail('person_course', 'not_created')
    }

    return assertPersonCourse(row)
  })

  return { personCourse: created }
}
