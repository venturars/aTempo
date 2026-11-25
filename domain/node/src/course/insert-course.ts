import { findOrganizationExists } from '../organization/find-organization-exists'
import { insertCourseRow } from '../postgres/executors/course'
import {
  assertCourse,
  assertCourseUpdate,
  normalizeContractAddress,
  type Course,
  type CourseUpdate,
} from '../types/course'
import { findAcronymAvailable } from './find-acronym-available'
import { findContractAddressAvailable } from './find-contract-address-available'

export type InsertCourseInput = {
  course: CourseUpdate
}

export type InsertCourseOutput = {
  course: Course | null
}

export async function insertCourse(
  input: InsertCourseInput,
): Promise<InsertCourseOutput> {
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

  const row = await insertCourseRow({
    ...course,
    contract_address: contractAddress,
  })
  if (!row) {
    return { course: null }
  }

  return { course: assertCourse(row) }
}
