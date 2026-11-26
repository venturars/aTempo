import { fail } from '../shared/errors'
import { findCourseIdByContractAddress } from '../postgres/executors/course'
import { normalizeUuid } from '../shared/validation/assert'
import { normalizeContractAddress } from '../shared/validation/course'

export type FindContractAddressAvailableInput = {
  contractAddress: string
  ignoreId?: string
}

export async function findContractAddressAvailable(
  input: FindContractAddressAvailableInput,
): Promise<void> {
  const wanted = normalizeContractAddress(input.contractAddress)
  const foundId = await findCourseIdByContractAddress(wanted)
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('course.contract_address', 'taken')
  }
}
