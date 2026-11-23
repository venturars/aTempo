import { ConflictError } from '../errors'
import { findCourseIdByAcronym } from '../postgres/executors/course'
import { assertUuid, normalizeUuid } from '../types/assert'

export type AssertAcronymAvailableInput = {
  organizationId: string
  acronym: string
  ignoreId?: string
}

export async function assertAcronymAvailable(
  input: AssertAcronymAvailableInput,
): Promise<void> {
  const organizationId = assertUuid(
    input.organizationId,
    'course.organization_id',
  )
  const foundId = await findCourseIdByAcronym(organizationId, input.acronym)
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    throw new ConflictError('course.acronym ya existe en la organización', {
      entity: 'course',
      field: 'acronym',
    })
  }
}
