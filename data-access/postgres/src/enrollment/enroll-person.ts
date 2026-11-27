import { fail } from '../shared/errors'
import { withTransaction } from '../postgres/pool'
import {
  addPersonCourseRow,
  lookupPersonCourse,
} from '../postgres/executors/person-course'
import { assertPersonCourse } from '../shared/validation/person-course'
import type { PersonCourse } from '../shared/types/person-course'

export type EnrollPersonInput = {
  personId: string
  courseId: string
}

export type EnrollPersonOutput = {
  personCourse: PersonCourse
}

/**
 * Matricula una persona en un curso. Persona y curso tienen que existir, y la
 * persona tiene que ser student o teacher.
 */
export async function enrollPerson(
  input: EnrollPersonInput,
): Promise<EnrollPersonOutput> {
  const personCourse = assertPersonCourse({
    person_id: input.personId,
    course_id: input.courseId,
  })

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
    if (!lookup.has_course_role) {
      fail('person_course', 'role_required')
    }

    const row = await addPersonCourseRow(personCourse, run)
    return assertPersonCourse(row)
  })

  return { personCourse: created }
}
