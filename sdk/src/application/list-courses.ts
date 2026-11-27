import type { Course } from '../domain/course'
import type { CourseRepository } from '../domain/course-repository'
import type { OrganizationRepository } from '../domain/organization-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type ListCoursesInput = { organizationId: string }

export type ListCoursesDeps = {
  organizations: OrganizationRepository
  courses: CourseRepository
}

export function createListCourses(deps: ListCoursesDeps) {
  return async function listCourses({
    organizationId,
  }: ListCoursesInput): Promise<Result<Course[]>> {
    const parsedId = parseUuid(organizationId)
    if (!parsedId.ok) return parsedId

    const organization = await deps.organizations.findById(parsedId.value)
    if (!organization) {
      return err(new AppError('NOT_FOUND', 'La organización no existe.'))
    }
    return ok(await deps.courses.listByOrganization(parsedId.value))
  }
}
