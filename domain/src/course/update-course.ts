import { query } from '../postgres/db'
import { assertCourse, type Course } from '../types/course'
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
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address`

export async function updateCourse(input: unknown): Promise<Course | null> {
  assertCourse(input)
  await assertContractAddressAvailable(input.contract_address, input.id)
  await assertAcronymAvailable(input.organization_id, input.acronym, input.id)

  const result = await query<Course>(UPDATE, [
    input.id,
    input.organization_id,
    input.name,
    input.acronym,
    input.start_at,
    input.end_at,
    input.contract_address,
  ])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  assertCourse(row)
  return row
}
