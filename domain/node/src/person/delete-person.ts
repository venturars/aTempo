import { withTransaction } from '../postgres/pool'
import {
  deletePersonById,
  deletePersonCourses,
  deletePersonRoles,
} from '../postgres/executors/person'
import { assertUuid } from '../types/assert'

export type DeletePersonInput = {
  id: string
}

export type DeletePersonOutput = {
  deleted: boolean
}

export async function deletePerson(
  input: DeletePersonInput,
): Promise<DeletePersonOutput> {
  const id = assertUuid(input.id, 'person.id')

  const deleted = await withTransaction(async (run) => {
    await deletePersonRoles(id, run)
    await deletePersonCourses(id, run)
    return deletePersonById(id, run)
  })

  return { deleted }
}
