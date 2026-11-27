import type { CourseRepository } from '../domain/course-repository'
import type { EnrollmentRepository } from '../domain/enrollment-repository'
import type { PersonRepository } from '../domain/person-repository'
import { isTeacher } from '../domain/roles'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type EnrollPersonInCourseInput = {
  organizationId: string
  courseId: string
  personId: string
}

export type EnrollPersonInCourseDeps = {
  persons: PersonRepository
  courses: CourseRepository
  enrollments: EnrollmentRepository
}

export function createEnrollPersonInCourse(deps: EnrollPersonInCourseDeps) {
  return async function enrollPersonInCourse(
    input: EnrollPersonInCourseInput,
  ): Promise<Result<void>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId
    const courseId = parseUuid(input.courseId)
    if (!courseId.ok) return courseId
    const personId = parseUuid(input.personId)
    if (!personId.ok) return personId

    const course = await deps.courses.findById(courseId.value)
    if (!course || course.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'El curso no existe.'))
    }

    const person = await deps.persons.findById(personId.value)
    if (!person || person.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'La persona no existe.'))
    }

    if (!person.roles.includes('student') && !isTeacher(person.roles)) {
      return err(
        new AppError(
          'VALIDATION',
          'Solo se puede matricular a un alumno o a un profesor.',
        ),
      )
    }

    if (
      await deps.enrollments.hasEnrollment(personId.value, courseId.value)
    ) {
      return err(
        new AppError('CONFLICT', 'Esa persona ya está matriculada en el curso.'),
      )
    }

    await deps.enrollments.enroll(personId.value, courseId.value)
    return ok(undefined)
  }
}