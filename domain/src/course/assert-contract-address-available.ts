import { COURSE_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import {
  assertCourse,
  normalizeContractAddress,
  type Course,
} from '../types/course'

const SELECT = `SELECT
  ${COURSE_COLUMNS}
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
