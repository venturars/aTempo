import { NotFoundError } from '../errors'
import { findPersonById } from '../postgres/repositories/person'

export type AssertPersonExistsInput = {
  id: string
}

export async function assertPersonExists(
  input: AssertPersonExistsInput,
): Promise<void> {
  const person = await findPersonById(input.id)
  if (!person) {
    throw new NotFoundError('person no existe', { entity: 'person' })
  }
}
