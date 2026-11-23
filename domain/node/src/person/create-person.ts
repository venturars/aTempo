import { fail } from '../errors'
import { insertPerson } from '../postgres/executors/person'
import {
  assertPerson,
  assertPersonCreate,
  normalizeEmail,
  type Person,
  type PersonCreate,
} from '../types/person'
import { assertEmailAvailable } from './assert-email-available'
import { assertIdentificationDocumentAvailable } from './assert-identification-document-available'

export type CreatePersonInput = {
  person: PersonCreate
}

export type CreatePersonOutput = {
  person: Person
}

export async function createPerson(
  input: CreatePersonInput,
): Promise<CreatePersonOutput> {
  const person = assertPersonCreate(input.person)
  const email = normalizeEmail(person.email)
  await assertIdentificationDocumentAvailable({
    identificationDocument: person.identification_document,
  })
  await assertEmailAvailable({ email })

  const row = await insertPerson({ ...person, email })
  if (!row) {
    fail('person', 'not_created')
  }

  return { person: assertPerson(row) }
}
