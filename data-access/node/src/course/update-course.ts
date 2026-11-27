import { findOrganizationExists } from '../organization/find-organization-exists'
import { updateCourseRow } from '../postgres/executors/course'
import {
  assertCourseUpdate,
  normalizeContractAddress,
} from '../shared/validation/course'
import { courseFromRow } from '../postgres/rows/course'
import type { Course, CourseUpdate } from '../shared/types/course'
import { findAcronymAvailable } from './find-acronym-available'
import { findContractAddressAvailable } from './find-contract-address-available'

export type UpdateCourseInput = {
  course: CourseUpdate
}

export type UpdateCourseOutput = {
  course: Course | null
}

export async function updateCourse(
  input: UpdateCourseInput,
): Promise<UpdateCourseOutput> {
  const course = assertCourseUpdate(input.course)
  const contractAddress = normalizeContractAddress(course.contract_address)
  await findOrganizationExists({ id: course.organization_id })
  await findContractAddressAvailable({
    contractAddress,
    ignoreId: course.id,
  })
  await findAcronymAvailable({
    organizationId: course.organization_id,
    acronym: course.acronym,
    ignoreId: course.id,
  })

  const row = await updateCourseRow({
    ...course,
    contract_address: contractAddress,
  })
  if (!row) {
    return { course: null }
  }

  return { course: courseFromRow(row) }
}
