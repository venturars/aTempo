import { withTransaction } from '../postgres/pool'
import {
  removeOrganizationById,
  removeOrganizationCourses,
  removeOrganizationEnrollments,
} from '../postgres/executors/organization'
import { assertUuid } from '../shared/validation/assert'
import { assertOrganization } from '../shared/validation/organization'
import type { Organization } from '../shared/types/organization'

export type RemoveOrganizationInput = {
  id: string
}

export type RemoveOrganizationOutput = {
  organization: Organization
}

/**
 * Borra una organización con sus cursos y matrículas y devuelve la
 * organización borrada. Lanza `organization.missing` si no existe.
 */
export async function removeOrganization(
  input: RemoveOrganizationInput,
): Promise<RemoveOrganizationOutput> {
  const id = assertUuid(input.id, 'organization.id')

  const removed = await withTransaction(async (run) => {
    await removeOrganizationEnrollments(id, run)
    await removeOrganizationCourses(id, run)
    return removeOrganizationById(id, run)
  })

  return { organization: assertOrganization(removed) }
}
