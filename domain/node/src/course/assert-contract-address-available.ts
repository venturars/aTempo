import { ConflictError } from '../errors'
import { findCourseIdByContractAddress } from '../postgres/executors/course'
import { normalizeUuid } from '../types/assert'
import { normalizeContractAddress } from '../types/course'

export type AssertContractAddressAvailableInput = {
  contractAddress: string
  ignoreId?: string
}

export async function assertContractAddressAvailable(
  input: AssertContractAddressAvailableInput,
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
    throw new ConflictError('course.contract_address ya existe', {
      entity: 'course',
      field: 'contract_address',
    })
  }
}
