import { withTransaction } from '../postgres/pool'
import {
  removePersonById,
  removePersonCourses,
  removePersonRoles,
} from '../postgres/executors/person'
import { assertUuid } from '../types/assert'

export type RemovePersonInput = {
  id: string
}

export type RemovePersonOutput = {
  deleted: boolean
}

export async function removePerson(
  input: RemovePersonInput,
): Promise<RemovePersonOutput> {
  const id = assertUuid(input.id, 'person.id')

  const deleted = await withTransaction(async (run) => {
    await removePersonRoles(id, run)
    await removePersonCourses(id, run)
    return removePersonById(id, run)
  })

  return { deleted }
}
