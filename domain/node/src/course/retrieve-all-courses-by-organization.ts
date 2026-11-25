import { retrieveAllCoursesByOrganizationId } from '../postgres/executors/course'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

export type RetrieveAllCoursesByOrganizationInput = {
  organizationId: string
}

export type RetrieveAllCoursesByOrganizationOutput = {
  courses: Course[]
}

export async function retrieveAllCoursesByOrganization(
  input: RetrieveAllCoursesByOrganizationInput,
): Promise<RetrieveAllCoursesByOrganizationOutput> {
  const organizationId = assertUuid(input.organizationId, 'organization.id')
  const rows = await retrieveAllCoursesByOrganizationId(organizationId)
  return { courses: rows.map((row) => assertCourse(row)) }
}
