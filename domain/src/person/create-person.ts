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
  id::text AS id,
  identification_document,
  email,
  first_name,
  last_name,
  birth_date::text AS birth_date,
  phone`

export async function createPerson(input: unknown): Promise<Person> {
  assertPersonInput(input)
  const email = normalizeEmail(input.email)
  await assertIdentificationDocumentAvailable(input.identification_document)
  await assertEmailAvailable(email)

  const result = await query<Person>(INSERT, [
    input.identification_document,
    email,
    input.first_name,
    input.last_name,
    input.birth_date,
    input.phone,
  ])
  const row = result.rows[0]
  if (!row) {
    throw new Error('person no se ha creado')
  }

  assertPerson(row)
  return row
}
