import { fail } from '../errors'
import { addPerson as addPersonRow } from '../postgres/executors/person'
import {
  personFromRow,
  assertPersonCreate,
  normalizeEmail,
  type Person,
  type PersonCreate,
} from '../types/person'
import { findEmailAvailable } from './find-email-available'
import { findIdentificationDocumentAvailable } from './find-identification-document-available'

export type AddPersonInput = {
  person: PersonCreate
}

export type AddPersonOutput = {
  person: Person
}

export async function addPerson(
  input: AddPersonInput,
): Promise<AddPersonOutput> {
  const person = assertPersonCreate(input.person)
  const email = normalizeEmail(person.email)
  await findIdentificationDocumentAvailable({
    identificationDocument: person.identification_document,
  })
  await findEmailAvailable({ email })

  const row = await addPersonRow({ ...person, email })
  if (!row) {
    fail('person', 'not_created')
  }

  return { person: personFromRow(row) }
}
