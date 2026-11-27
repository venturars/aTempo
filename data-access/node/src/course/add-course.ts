import { fail } from '../shared/errors'
import { findOrganizationExists } from '../organization/find-organization-exists'
import { addCourseRow } from '../postgres/executors/course'
import {
  assertCourseCreate,
  normalizeContractAddress,
} from '../shared/validation/course'
import { courseFromRow } from '../postgres/rows/course'
import type { Course, CourseCreate } from '../shared/types/course'
import { findAcronymAvailable } from './find-acronym-available'
import { findContractAddressAvailable } from './find-contract-address-available'

export type AddCourseInput = {
  course: CourseCreate
}

export type AddCourseOutput = {
  course: Course
}

export async function addCourse(
  input: AddCourseInput,
): Promise<AddCourseOutput> {
  const course = assertCourseCreate(input.course)
  const contractAddress = normalizeContractAddress(course.contract_address)
  await findOrganizationExists({ id: course.organization_id })
  await findContractAddressAvailable({ contractAddress })
  await findAcronymAvailable({
    organizationId: course.organization_id,
    acronym: course.acronym,
  })

  const row = await addCourseRow({
    ...course,
    contract_address: contractAddress,
  })
  if (!row) {
    fail('course', 'not_created')
  }

  return { course: courseFromRow(row) }
}
