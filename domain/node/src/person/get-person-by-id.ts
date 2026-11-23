import { findPersonById } from '../postgres/executors/person'
import { assertUuid } from '../types/assert'
import { assertPerson, type Person } from '../types/person'

export type GetPersonByIdInput = {
  id: string
}

export type GetPersonByIdOutput = {
  person: Person | null
}

export async function getPersonById(
  input: GetPersonByIdInput,
): Promise<GetPersonByIdOutput> {
  const id = assertUuid(input.id, 'person.id')
  const row = await findPersonById(id)
  if (!row) {
    return { person: null }
  }

  return { person: assertPerson(row) }
}
