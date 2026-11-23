import { PersistenceError } from '../errors'
import { insertPerson } from '../postgres/repositories/person'
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
    throw new PersistenceError('person no se ha creado', { entity: 'person' })
  }

  return { person: assertPerson(row) }
}
