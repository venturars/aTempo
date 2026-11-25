import { fail } from '../errors'
import { findPersonIdByEmail } from '../postgres/executors/person'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'
import { normalizeEmail } from '../types/person'

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
