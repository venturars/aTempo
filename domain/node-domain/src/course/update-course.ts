import { assertOrganizationExists } from '../organization/assert-organization-exists'
import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import {
  assertCourse,
  assertCourseUpdate,
  normalizeContractAddress,
  type Course,
} from '../types/course'
import { assertAcronymAvailable } from './assert-acronym-available'
import { assertContractAddressAvailable } from './assert-contract-address-available'

const UPDATE = `UPDATE course
SET
  organization_id = $2::uuid,
  name = $3,
  acronym = $4,
  start_at = $5,
  end_at = $6,
  contract_address = $7
WHERE id = $1::uuid
RETURNING
  ${COURSE_COLUMNS}`

export async function updateCourse(input: unknown): Promise<Course | null> {
  const course = assertCourseUpdate(input)
  const contractAddress = normalizeContractAddress(course.contract_address)
  await assertOrganizationExists(course.organization_id)
  await assertContractAddressAvailable(contractAddress, course.id)
  await assertAcronymAvailable(course.organization_id, course.acronym, course.id)

  const result = await query<Course>(UPDATE, [
    course.id,
    course.organization_id,
    course.name,
    course.acronym,
    course.start_at,
    course.end_at,
    contractAddress,
  ])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  return assertCourse(row)
}
