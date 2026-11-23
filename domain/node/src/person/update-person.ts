import { updatePersonRow } from '../postgres/executors/person'
import {
  assertPerson,
  assertPersonUpdate,
  normalizeEmail,
  type Person,
  type PersonUpdate,
} from '../types/person'
import { assertEmailAvailable } from './assert-email-available'
import { assertIdentificationDocumentAvailable } from './assert-identification-document-available'

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
  await assertIdentificationDocumentAvailable({
    identificationDocument: person.identification_document,
    ignoreId: person.id,
  })
  await assertEmailAvailable({ email, ignoreId: person.id })

  const row = await updatePersonRow({ ...person, email })
  if (!row) {
    return { person: null }
  }

  return { person: assertPerson(row) }
}
