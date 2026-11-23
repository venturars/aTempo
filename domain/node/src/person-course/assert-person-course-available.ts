import { fail } from '../errors'
import { lookupPersonCourse } from '../postgres/executors/person-course'
import type { PersonCourse } from '../types/person-course'

export type AssertPersonCourseAvailableInput = {
  personCourse: PersonCourse
}

export async function assertPersonCourseAvailable(
  input: AssertPersonCourseAvailableInput,
): Promise<void> {
  const lookup = await lookupPersonCourse(input.personCourse)
  if (lookup?.already) {
    fail('person_course', 'taken')
  }
}
