import { withTransaction } from '../postgres/pool'
import {
  removePersonById,
  removePersonCourses,
  removePersonRoles,
} from '../postgres/executors/person'
import { personFromRow } from '../postgres/rows/person'
import { assertUuid } from '../shared/validation/assert'
import type { Person } from '../shared/types/person'
import { ensurePersonCanBeRemoved } from './rules'

export type RemovePersonInput = {
  id: string
}

export type RemovePersonOutput = {
  person: Person
}

/**
 * Borra una persona con sus roles y matrículas y devuelve la persona borrada.
 * No borra al organization_admin ni a un teacher que todavía está en algún
 * curso. Lanza `person.missing` si no existe.
 */
export async function removePerson(
  input: RemovePersonInput,
): Promise<RemovePersonOutput> {
  const id = assertUuid(input.id, 'person.id')

  const removed = await withTransaction(async (run) => {
    await ensurePersonCanBeRemoved({ id }, run)
    await removePersonRoles(id, run)
    await removePersonCourses(id, run)
    return removePersonById(id, run)
  })

  return { person: personFromRow(removed) }
}
