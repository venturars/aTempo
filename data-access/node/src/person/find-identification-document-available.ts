import { fail } from '../shared/errors'
import { findPersonIdByIdentificationDocument } from '../postgres/executors/person'
import {
  assertNonEmptyString,
  normalizeUuid,
} from '../shared/validation/assert'

export type FindIdentificationDocumentAvailableInput = {
  identificationDocument: string
  ignoreId?: string
}

export async function findIdentificationDocumentAvailable(
  input: FindIdentificationDocumentAvailableInput,
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
