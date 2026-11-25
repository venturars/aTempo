import { fail } from '../errors'
import { lookupPersonCourse } from '../postgres/executors/person-course'
import type { PersonCourse } from '../types/person-course'

export type FindPersonCourseAvailableInput = {
  personCourse: PersonCourse
}

export async function findPersonCourseAvailable(
  input: FindPersonCourseAvailableInput,
): Promise<void> {
  const lookup = await lookupPersonCourse(input.personCourse)
  if (lookup?.already) {
    fail('person_course', 'taken')
  }
}
