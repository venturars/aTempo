import { insertPersonRow } from '../postgres/executors/person'
import {
  assertPerson,
  assertPersonUpdate,
  normalizeEmail,
  type Person,
  type PersonUpdate,
} from '../types/person'
import { findEmailAvailable } from './find-email-available'
import { findIdentificationDocumentAvailable } from './find-identification-document-available'

export type InsertPersonInput = {
  person: PersonUpdate
}

export type InsertPersonOutput = {
  person: Person | null
}

export async function insertPerson(
  input: InsertPersonInput,
): Promise<InsertPersonOutput> {
  const person = assertPersonUpdate(input.person)
  const email = normalizeEmail(person.email)
  await findIdentificationDocumentAvailable({
    identificationDocument: person.identification_document,
    ignoreId: person.id,
  })
  await findEmailAvailable({ email, ignoreId: person.id })

  const row = await insertPersonRow({ ...person, email })
  if (!row) {
    return { person: null }
  }

  return { person: assertPerson(row) }
}
