import type { ContractAddress } from './contract-address'
import type { Uuid } from './scalars'
import type { NonEmptyText } from './text'

export type Course = {
  readonly id: Uuid
  readonly organizationId: Uuid
  readonly name: NonEmptyText
  readonly acronym: NonEmptyText
  readonly startAt: string
  readonly endAt: string
  readonly contractAddress: ContractAddress
}