import { PersistenceError } from '../errors'
import { assertOrganizationExists } from '../organization/assert-organization-exists'
import { insertCourse } from '../postgres/executors/course'
import {
  assertCourse,
  assertCourseCreate,
  normalizeContractAddress,
  type Course,
  type CourseCreate,
} from '../types/course'
import { assertAcronymAvailable } from './assert-acronym-available'
import { assertContractAddressAvailable } from './assert-contract-address-available'

export type CreateCourseInput = {
  course: CourseCreate
}

export type CreateCourseOutput = {
  course: Course
}

export async function createCourse(
  input: CreateCourseInput,
): Promise<CreateCourseOutput> {
  const course = assertCourseCreate(input.course)
  const contractAddress = normalizeContractAddress(course.contract_address)
  await assertOrganizationExists({ id: course.organization_id })
  await assertContractAddressAvailable({ contractAddress })
  await assertAcronymAvailable({
    organizationId: course.organization_id,
    acronym: course.acronym,
  })

  const row = await insertCourse({ ...course, contract_address: contractAddress })
  if (!row) {
    throw new PersistenceError('course no se ha creado', { entity: 'course' })
  }

  return { course: assertCourse(row) }
}
