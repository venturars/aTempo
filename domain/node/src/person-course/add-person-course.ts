import { ConflictError, NotFoundError, PersistenceError } from '../errors'
import { withTransaction } from '../postgres/pool'
import {
  insertPersonCourse,
  lookupPersonCourse,
} from '../postgres/repositories/person-course'
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
      throw new NotFoundError('person no existe', { entity: 'person' })
    }
    if (!lookup.course_exists) {
      throw new NotFoundError('course no existe', { entity: 'course' })
    }
    if (lookup.already) {
      throw new ConflictError('person_course ya existe', {
        entity: 'person_course',
      })
    }

    const row = await insertPersonCourse(personCourse, run)
    if (!row) {
      throw new PersistenceError('person_course no se ha creado', {
        entity: 'person_course',
      })
    }

    return assertPersonCourse(row)
  })

  return { personCourse: created }
}
