import { findPersonById } from '../postgres/executors/person'
import { assertUuid } from '../shared/validation/assert'
import { personFromRow } from '../postgres/rows/person'
import type { Person } from '../shared/types/person'

export type RetrievePersonByIdInput = {
  id: string
}

export type RetrievePersonByIdOutput = {
  person: Person | null
}

export async function retrievePersonById(
  input: RetrievePersonByIdInput,
): Promise<RetrievePersonByIdOutput> {
  const id = assertUuid(input.id, 'person.id')
  const row = await findPersonById(id)
  if (!row) {
    return { person: null }
  }

  return { person: personFromRow(row) }
}
