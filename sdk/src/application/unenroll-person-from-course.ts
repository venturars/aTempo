import type { CourseRepository } from '../domain/course-repository'
import type { EnrollmentRepository } from '../domain/enrollment-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type UnenrollPersonFromCourseInput = {
  organizationId: string
  courseId: string
  personId: string
}

export type UnenrollPersonFromCourseDeps = {
  courses: CourseRepository
  enrollments: EnrollmentRepository
}

export function createUnenrollPersonFromCourse(deps: UnenrollPersonFromCourseDeps) {
  return async function unenrollPersonFromCourse(
    input: UnenrollPersonFromCourseInput,
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

    const removed = await deps.enrollments.unenroll(
      personId.value,
      courseId.value,
    )
    if (!removed) {
      return err(
        new AppError('NOT_FOUND', 'Esa persona no está matriculada en el curso.'),
      )
    }
    return ok(undefined)
  }
}