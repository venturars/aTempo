import { fail } from '../errors'
import { findPersonById } from '../postgres/executors/person'

export type AssertPersonExistsInput = {
  id: string
}

export async function assertPersonExists(
  input: AssertPersonExistsInput,
): Promise<void> {
  const person = await findPersonById(input.id)
  if (!person) {
    fail('person', 'missing')
  }
}
