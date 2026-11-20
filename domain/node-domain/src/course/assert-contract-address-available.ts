import { query } from '../postgres/db'
import { normalizeUuid } from '../types/assert'
import { normalizeContractAddress } from '../types/course'

const SELECT = `SELECT id::text AS id
FROM course
WHERE lower(contract_address) = $1`

export async function assertContractAddressAvailable(
  contractAddress: string,
  ignoreId?: string,
): Promise<void> {
  const wanted = normalizeContractAddress(contractAddress)
  const result = await query<{ id: string }>(SELECT, [wanted])
  const row = result.rows[0]
  if (!row) {
    return
  }

  if (ignoreId === undefined || normalizeUuid(row.id) !== normalizeUuid(ignoreId)) {
    throw new Error('course.contract_address ya existe')
  }
}
