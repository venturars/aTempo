import { ensureOrganizationExists } from '../organizations/rules'
import { addCourseRow } from '../postgres/executors/course'
import {
  assertCourseCreate,
  normalizeContractAddress,
} from '../shared/validation/course'
import { courseFromRow } from '../postgres/rows/course'
import type { Course, CourseCreate } from '../shared/types/course'
import { ensureAcronymAvailable, ensureContractAddressAvailable } from './rules'

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
  await ensureOrganizationExists({ id: course.organization_id })
  await ensureContractAddressAvailable({ contractAddress })
  await ensureAcronymAvailable({
    organizationId: course.organization_id,
    acronym: course.acronym,
  })

  const row = await addCourseRow({
    ...course,
    contract_address: contractAddress,
  })
  return { course: courseFromRow(row) }
}
