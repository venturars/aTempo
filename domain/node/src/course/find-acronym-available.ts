import { fail } from '../errors'
import { findCourseIdByAcronym } from '../postgres/executors/course'
import {
  assertNonEmptyString,
  assertUuid,
  normalizeUuid,
} from '../types/assert'

export type FindAcronymAvailableInput = {
  organizationId: string
  acronym: string
  ignoreId?: string
}

export async function findAcronymAvailable(
  input: FindAcronymAvailableInput,
): Promise<void> {
  const organizationId = assertUuid(
    input.organizationId,
    'course.organization_id',
  )
  const acronym = assertNonEmptyString(input.acronym, 'course.acronym')
  const foundId = await findCourseIdByAcronym(organizationId, acronym)
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('course.acronym', 'taken')
  }
}
