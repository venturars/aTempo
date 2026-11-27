import { removePersonCourseRow } from '../postgres/executors/person-course'
import { assertPersonCourse } from '../shared/validation/person-course'
import type { PersonCourse } from '../shared/types/person-course'

export type UnenrollPersonInput = {
  personId: string
  courseId: string
}

export type UnenrollPersonOutput = {
  personCourse: PersonCourse
}

/**
 * Quita a una persona de un curso y devuelve la matrícula borrada. Lanza
 * `person_course.missing` si la persona no estaba en el curso.
 */
export async function unenrollPerson(
  input: UnenrollPersonInput,
): Promise<UnenrollPersonOutput> {
  const personCourse = assertPersonCourse({
    person_id: input.personId,
    course_id: input.courseId,
  })
  const removed = await removePersonCourseRow(
    personCourse.person_id,
    personCourse.course_id,
  )
  return { personCourse: assertPersonCourse(removed) }
}
