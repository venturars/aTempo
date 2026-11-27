import { fail } from '../shared/errors'
import { findPersonById } from '../postgres/executors/person'
import { query, type PostgresQuery } from '../postgres/pool'

export type FindPersonExistsInput = {
  id: string
}

export async function findPersonExists(
  input: FindPersonExistsInput,
  run: PostgresQuery = query,
): Promise<void> {
  const person = await findPersonById(input.id, run)
  if (!person) {
    fail('person', 'missing')
  }
}
