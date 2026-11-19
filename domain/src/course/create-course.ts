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
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address`

export async function createCourse(input: unknown): Promise<Course> {
  assertCourseInput(input)
  const contractAddress = normalizeContractAddress(input.contract_address)
  await assertContractAddressAvailable(contractAddress)
  await assertAcronymAvailable(input.organization_id, input.acronym)

  const result = await query<Course>(INSERT, [
    input.organization_id,
    input.name,
    input.acronym,
    input.start_at,
    input.end_at,
    contractAddress,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('course no se ha creado')
  }

  assertCourse(row)
  return row
}
