import type { CourseRepository } from '../domain/course-repository'
import type { EnrollmentRepository } from '../domain/enrollment-repository'
import type { Person } from '../domain/person'
import type { PersonRepository } from '../domain/person-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type ListCoursePeopleInput = {
  organizationId: string
  courseId: string
}

export type ListCoursePeopleDeps = {
  persons: PersonRepository
  courses: CourseRepository
  enrollments: EnrollmentRepository
}

export function createListCoursePeople(deps: ListCoursePeopleDeps) {
  return async function listCoursePeople(
    input: ListCoursePeopleInput,
  ): Promise<Result<Person[]>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId
    const courseId = parseUuid(input.courseId)
    if (!courseId.ok) return courseId

    const course = await deps.courses.findById(courseId.value)
    if (!course || course.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'El curso no existe.'))
    }

    const personIds = await deps.enrollments.listPersonIdsByCourse(courseId.value)
    const people: Person[] = []
    for (const personId of personIds) {
      const person = await deps.persons.findById(personId)
      if (person) people.push(person)
    }
    return ok(people)
  }
}