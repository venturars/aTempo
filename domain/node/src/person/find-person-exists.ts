import { fail } from '../errors'
import { findPersonById } from '../postgres/executors/person'

export type FindPersonExistsInput = {
  id: string
}

export async function findPersonExists(
  input: FindPersonExistsInput,
): Promise<void> {
  const person = await findPersonById(input.id)
  if (!person) {
    fail('person', 'missing')
  }
}
