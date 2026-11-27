import type { Course } from '../domain/course'
import type { CourseRepository } from '../domain/course-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type GetCourseInput = {
  organizationId: string
  courseId: string
}

export type GetCourseDeps = {
  courses: CourseRepository
}

export function createGetCourse(deps: GetCourseDeps) {
  return async function getCourse(
    input: GetCourseInput,
  ): Promise<Result<Course>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId
    const courseId = parseUuid(input.courseId)
    if (!courseId.ok) return courseId

    const course = await deps.courses.findById(courseId.value)
    if (!course || course.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'El curso no existe.'))
    }
    return ok(course)
  }
}
