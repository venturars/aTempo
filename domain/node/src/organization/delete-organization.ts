import { withTransaction } from '../postgres/pool'
import {
  deleteOrganizationById,
  deleteOrganizationCourses,
  deleteOrganizationEnrollments,
} from '../postgres/executors/organization'
import { assertUuid } from '../types/assert'

export type DeleteOrganizationInput = {
  id: string
}

export type DeleteOrganizationOutput = {
  deleted: boolean
}

export async function deleteOrganization(
  input: DeleteOrganizationInput,
): Promise<DeleteOrganizationOutput> {
  const id = assertUuid(input.id, 'organization.id')

  const deleted = await withTransaction(async (run) => {
    await deleteOrganizationEnrollments(id, run)
    await deleteOrganizationCourses(id, run)
    return deleteOrganizationById(id, run)
  })

  return { deleted }
}
