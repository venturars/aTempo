import { fail } from '../shared/errors'
import { findPersonIdByEmail } from '../postgres/executors/person'
import {
  assertNonEmptyString,
  normalizeUuid,
} from '../shared/validation/assert'
import { normalizeEmail } from '../shared/validation/person'

export type FindEmailAvailableInput = {
  email: string
  ignoreId?: string
}

export async function findEmailAvailable(
  input: FindEmailAvailableInput,
): Promise<void> {
  const email = normalizeEmail(
    assertNonEmptyString(input.email, 'person.email'),
  )
  const foundId = await findPersonIdByEmail(email)
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('person.email', 'taken')
  }
}
