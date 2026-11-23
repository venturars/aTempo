import { listCoursesByOrganizationId } from '../postgres/executors/course'
import { assertUuid } from '../types/assert'
import { assertCourse, type Course } from '../types/course'

export type ListCoursesByOrganizationInput = {
  organizationId: string
}

export type ListCoursesByOrganizationOutput = {
  courses: Course[]
}

export async function listCoursesByOrganization(
  input: ListCoursesByOrganizationInput,
): Promise<ListCoursesByOrganizationOutput> {
  const organizationId = assertUuid(input.organizationId, 'organization.id')
  const rows = await listCoursesByOrganizationId(organizationId)
  return { courses: rows.map((row) => assertCourse(row)) }
}
