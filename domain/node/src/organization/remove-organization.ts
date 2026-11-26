import { withTransaction } from '../postgres/pool'
import {
  removeOrganizationById,
  removeOrganizationCourses,
  removeOrganizationEnrollments,
} from '../postgres/executors/organization'
import { assertUuid } from '../shared/validation/assert'

export type RemoveOrganizationInput = {
  id: string
}

export type RemoveOrganizationOutput = {
  deleted: boolean
}

export async function removeOrganization(
  input: RemoveOrganizationInput,
): Promise<RemoveOrganizationOutput> {
  const id = assertUuid(input.id, 'organization.id')

  const deleted = await withTransaction(async (run) => {
    await removeOrganizationEnrollments(id, run)
    await removeOrganizationCourses(id, run)
    return removeOrganizationById(id, run)
  })

  return { deleted }
}
