import { ConflictError } from '../errors'
import { lookupPersonCourse } from '../postgres/repositories/person-course'
import type { PersonCourse } from '../types/person-course'

export type AssertPersonCourseAvailableInput = {
  personCourse: PersonCourse
}

export async function assertPersonCourseAvailable(
  input: AssertPersonCourseAvailableInput,
): Promise<void> {
  const lookup = await lookupPersonCourse(input.personCourse)
  if (lookup?.already) {
    throw new ConflictError('person_course ya existe', {
      entity: 'person_course',
    })
  }
}
