import { query } from '../postgres/db'
import {
  assertCourse,
  normalizeContractAddress,
  type Course,
} from '../types/course'

const SELECT = `SELECT
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address
FROM course
WHERE lower(contract_address) = $1`

export async function assertContractAddressAvailable(
  contractAddress: string,
  ignoreId?: string,
): Promise<void> {
  const wanted = normalizeContractAddress(contractAddress)
  const result = await query<Course>(SELECT, [wanted])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertCourse(row)
  if (row.id !== ignoreId) {
    throw new Error('course.contract_address ya existe')
  }
}
