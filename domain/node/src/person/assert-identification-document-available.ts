import { fail } from '../errors'
import { findPersonIdByIdentificationDocument } from '../postgres/executors/person'
import { assertNonEmptyString, normalizeUuid } from '../types/assert'

export type AssertIdentificationDocumentAvailableInput = {
  identificationDocument: string
  ignoreId?: string
}

export async function assertIdentificationDocumentAvailable(
  input: AssertIdentificationDocumentAvailableInput,
): Promise<void> {
  const identificationDocument = assertNonEmptyString(
    input.identificationDocument,
    'person.identification_document',
  )
  const foundId = await findPersonIdByIdentificationDocument(
    identificationDocument.toLowerCase(),
  )
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('person.identification_document', 'taken')
  }
}
