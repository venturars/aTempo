import type { TaxId } from './identifier'
import type { Uuid } from './scalars'
import type { NonEmptyText } from './text'

export type Organization = {
  readonly id: Uuid
  readonly name: NonEmptyText
  readonly taxId: TaxId
}