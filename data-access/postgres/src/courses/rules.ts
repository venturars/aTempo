import { fail } from '../shared/errors'
import {
  findCourseIdByAcronym,
  findCourseIdByContractAddress,
} from '../postgres/executors/course'
import { query, type PostgresQuery } from '../postgres/pool'
import {
  assertNonEmptyString,
  assertUuid,
  normalizeUuid,
} from '../shared/validation/assert'
import { normalizeContractAddress } from '../shared/validation/course'

export type EnsureAcronymAvailableInput = {
  organizationId: string
  acronym: string
  ignoreId?: string
}

/**
 * Lanza `course.acronym.taken` si otro curso de la organización ya usa ese
 * acrónimo. `ignoreId` es el curso que se modifica: su propio acrónimo no
 * cuenta.
 */
export async function ensureAcronymAvailable(
  input: EnsureAcronymAvailableInput,
  run: PostgresQuery = query,
): Promise<void> {
  const organizationId = assertUuid(
    input.organizationId,
    'course.organization_id',
  )
  const acronym = assertNonEmptyString(input.acronym, 'course.acronym')
  const foundId = await findCourseIdByAcronym(organizationId, acronym, run)
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('course.acronym', 'taken')
  }
}

export type EnsureContractAddressAvailableInput = {
  contractAddress: string
  ignoreId?: string
}

/**
 * Lanza `course.contract_address.taken` si otro curso ya usa ese contrato.
 * `ignoreId` es el curso que se modifica.
 */
export async function ensureContractAddressAvailable(
  input: EnsureContractAddressAvailableInput,
  run: PostgresQuery = query,
): Promise<void> {
  const wanted = normalizeContractAddress(input.contractAddress)
  const foundId = await findCourseIdByContractAddress(wanted, run)
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
