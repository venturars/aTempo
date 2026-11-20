import { assertOrganizationExists } from '../organization/assert-organization-exists'
import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import {
  assertCourse,
  assertCourseInput,
  normalizeContractAddress,
  type Course,
} from '../types/course'
import { assertAcronymAvailable } from './assert-acronym-available'
import { assertContractAddressAvailable } from './assert-contract-address-available'

const INSERT = `INSERT INTO course (
  organization_id,
  name,
  acronym,
  start_at,
  end_at,
  contract_address
) VALUES ($1::uuid, $2, $3, $4, $5, $6)
RETURNING
  ${COURSE_COLUMNS}`

export async function createCourse(input: unknown): Promise<Course> {
  const body = assertCourseInput(input)
  const contractAddress = normalizeContractAddress(body.contract_address)
  await assertOrganizationExists(body.organization_id)
  await assertContractAddressAvailable(contractAddress)
  await assertAcronymAvailable(body.organization_id, body.acronym)

  const result = await query<Course>(INSERT, [
    body.organization_id,
    body.name,
    body.acronym,
    body.start_at,
    body.end_at,
    contractAddress,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('course no se ha creado')
  }

  return assertCourse(row)
}
