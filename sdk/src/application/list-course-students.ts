import type { CourseRepository } from '../domain/course-repository'
import type { EnrollmentRepository } from '../domain/enrollment-repository'
import type { Person } from '../domain/person'
import type { PersonRepository } from '../domain/person-repository'
import { isStudent } from '../domain/roles'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type ListCourseStudentsInput = {
  organizationId: string
  courseId: string
}

export type ListCourseStudentsDeps = {
  persons: PersonRepository
  courses: CourseRepository
  enrollments: EnrollmentRepository
}

export function createListCourseStudents(deps: ListCourseStudentsDeps) {
  return async function listCourseStudents(
    input: ListCourseStudentsInput,
  ): Promise<Result<Person[]>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId
    const courseId = parseUuid(input.courseId)
    if (!courseId.ok) return courseId

    const course = await deps.courses.findById(courseId.value)
    if (!course || course.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'El curso no existe.'))
    }

    const personIds = await deps.enrollments.listPersonIdsByCourse(
      courseId.value,
    )
    const students: Person[] = []
    for (const personId of personIds) {
      const person = await deps.persons.findById(personId)
      if (person && isStudent(person.roles)) students.push(person)
    }
    return ok(students)
  }
}
