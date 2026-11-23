import { ConflictError } from '../errors'
import { findPersonIdByEmail } from '../postgres/repositories/person'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'
import { normalizeEmail } from '../types/person'

export type AssertEmailAvailableInput = {
  email: string
  ignoreId?: string
}

export async function assertEmailAvailable(
  input: AssertEmailAvailableInput,
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
    throw new ConflictError('person.email ya existe', {
      entity: 'person',
      field: 'email',
    })
  }
}
