import { PERSON_COLUMNS } from '../postgres/columns'
import { query } from '../postgres/db'
import { assertPerson, normalizeEmail, type Person } from '../types/person'
import { assertEmailAvailable } from './assert-email-available'
import { assertIdentificationDocumentAvailable } from './assert-identification-document-available'

const UPDATE = `UPDATE person
SET
  identification_document = $2,
  email = $3,
  first_name = $4,
  last_name = $5,
  birth_date = $6,
  phone = $7
WHERE id = $1::uuid
RETURNING
  ${PERSON_COLUMNS}`

export async function updatePerson(input: unknown): Promise<Person | null> {
  const person = assertPerson(input)
  const email = normalizeEmail(person.email)
  await assertIdentificationDocumentAvailable(
    person.identification_document,
    person.id,
  )
  await assertEmailAvailable(email, person.id)

  const result = await query<Person>(UPDATE, [
    person.id,
    person.identification_document,
    email,
    person.first_name,
    person.last_name,
    person.birth_date,
    person.phone,
  ])
  const row = result.rows[0]
  if (!row) {
    return null
  }

  return assertPerson(row)
}
