import { Person } from '../domain/person'
import { PersonRepository } from '../domain/person-repository'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type GetPersonInput = { personId: string }

export type GetPersonDeps = {
  persons: PersonRepository
}

export function createGetPerson(deps: GetPersonDeps) {
  return async function getPerson({
    personId,
  }: GetPersonInput): Promise<Result<Person>> {
    const parsedId = parseUuid(personId)
    if (!parsedId.ok) return parsedId

    const person = await deps.persons.findById(parsedId.value)
    if (!person) {
      return err(new AppError('NOT_FOUND', 'La persona no existe.'))
    }
    return ok(person)
  }
}
