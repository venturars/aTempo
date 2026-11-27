import { addPersonRow } from '../postgres/executors/person'
import { assertPersonCreate, normalizeEmail } from '../shared/validation/person'
import { personFromRow } from '../postgres/rows/person'
import type { Person, PersonCreate } from '../shared/types/person'
import {
  ensureEmailAvailable,
  ensureIdentificationDocumentAvailable,
} from './rules'

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
  await ensureIdentificationDocumentAvailable({
    identificationDocument: person.identification_document,
  })
  await ensureEmailAvailable({ email })

  const row = await addPersonRow({ ...person, email })
  return { person: personFromRow(row) }
}
