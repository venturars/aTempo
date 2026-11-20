import { PERSON_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import {
  assertPerson,
  assertPersonInput,
  normalizeEmail,
  type Person,
} from '../types/person'
import { assertEmailAvailable } from './assert-email-available'
import { assertIdentificationDocumentAvailable } from './assert-identification-document-available'

const INSERT = `INSERT INTO person (
  identification_document,
  email,
  first_name,
  last_name,
  birth_date,
  phone
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
  ${PERSON_COLUMNS}`

export async function createPerson(input: unknown): Promise<Person> {
  const body = assertPersonInput(input)
  const email = normalizeEmail(body.email)
  await assertIdentificationDocumentAvailable(body.identification_document)
  await assertEmailAvailable(email)

  const result = await query<Person>(INSERT, [
    body.identification_document,
    email,
    body.first_name,
    body.last_name,
    body.birth_date,
    body.phone,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('person no se ha creado')
  }

  return assertPerson(row)
}
