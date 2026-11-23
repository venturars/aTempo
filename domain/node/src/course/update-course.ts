import { assertOrganizationExists } from '../organization/assert-organization-exists'
import { updateCourseRow } from '../postgres/repositories/course'
import {
  assertCourse,
  assertCourseUpdate,
  normalizeContractAddress,
  type Course,
  type CourseUpdate,
} from '../types/course'
import { assertAcronymAvailable } from './assert-acronym-available'
import { assertContractAddressAvailable } from './assert-contract-address-available'

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
  await assertOrganizationExists({ id: course.organization_id })
  await assertContractAddressAvailable({
    contractAddress,
    ignoreId: course.id,
  })
  await assertAcronymAvailable({
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

  return { course: assertCourse(row) }
}
