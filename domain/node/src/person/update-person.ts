import { updatePersonRow } from '../postgres/executors/person'
import {
  personFromRow,
  assertPersonUpdate,
  normalizeEmail,
  type Person,
  type PersonUpdate,
} from '../types/person'
import { findEmailAvailable } from './find-email-available'
import { findIdentificationDocumentAvailable } from './find-identification-document-available'

export type UpdatePersonInput = {
  person: PersonUpdate
}

export type UpdatePersonOutput = {
  person: Person | null
}

export async function updatePerson(
  input: UpdatePersonInput,
): Promise<UpdatePersonOutput> {
  const person = assertPersonUpdate(input.person)
  const email = normalizeEmail(person.email)
  await findIdentificationDocumentAvailable({
    identificationDocument: person.identification_document,
    ignoreId: person.id,
  })
  await findEmailAvailable({ email, ignoreId: person.id })

  const row = await updatePersonRow({ ...person, email })
  if (!row) {
    return { person: null }
  }

  return { person: personFromRow(row) }
}
