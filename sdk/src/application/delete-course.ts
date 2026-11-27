import type { CourseRepository } from '../domain/course-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type DeleteCourseInput = {
  organizationId: string
  courseId: string
}

export type DeleteCourseDeps = {
  courses: CourseRepository
}

export function createDeleteCourse(deps: DeleteCourseDeps) {
  return async function deleteCourse(
    input: DeleteCourseInput,
  ): Promise<Result<void>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId
    const courseId = parseUuid(input.courseId)
    if (!courseId.ok) return courseId

    const course = await deps.courses.findById(courseId.value)
    if (!course || course.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'El curso no existe.'))
    }

    await deps.courses.delete(courseId.value)
    return ok(undefined)
  }
}