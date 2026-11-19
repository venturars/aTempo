import { query } from '../postgres/db'
import { assertCourse, type Course } from '../types/course'

const SELECT = `SELECT
  id::text AS id,
  organization_id::text AS organization_id,
  name,
  acronym,
  start_at::text AS start_at,
  end_at::text AS end_at,
  contract_address
FROM course
WHERE contract_address = $1`

export async function assertContractAddressAvailable(
  contractAddress: string,
  ignoreId?: string,
): Promise<void> {
  const result = await query<Course>(SELECT, [contractAddress])
  const row = result.rows[0]
  if (!row) {
    return
  }

  assertCourse(row)
  if (row.id !== ignoreId) {
    throw new Error('course.contract_address ya existe')
  }
}
