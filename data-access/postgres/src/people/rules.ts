import { fail } from '../shared/errors'
import {
  findPersonById,
  findPersonIdByEmail,
  findPersonIdByIdentificationDocument,
} from '../postgres/executors/person'
import { personHasCourses } from '../postgres/executors/person-course'
import { retrieveAllRolesByPersonId } from '../postgres/executors/role'
import { query, type PostgresQuery } from '../postgres/pool'
import {
  assertNonEmptyString,
  normalizeUuid,
} from '../shared/validation/assert'
import { normalizeEmail } from '../shared/validation/person'

export type EnsurePersonExistsInput = {
  id: string
}

/** Lanza `person.missing` si la persona no existe. */
export async function ensurePersonExists(
  input: EnsurePersonExistsInput,
  run: PostgresQuery = query,
): Promise<void> {
  const person = await findPersonById(input.id, run)
  if (!person) {
    fail('person', 'missing')
  }
}

export type EnsureEmailAvailableInput = {
  email: string
  ignoreId?: string
}

/**
 * Lanza `person.email.taken` si otra persona ya usa ese email.
 * `ignoreId` es la persona que se modifica: su propio email no cuenta.
 */
export async function ensureEmailAvailable(
  input: EnsureEmailAvailableInput,
  run: PostgresQuery = query,
): Promise<void> {
  const email = normalizeEmail(
    assertNonEmptyString(input.email, 'person.email'),
  )
  const foundId = await findPersonIdByEmail(email, run)
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('person.email', 'taken')
  }
}

export type EnsureIdentificationDocumentAvailableInput = {
  identificationDocument: string
  ignoreId?: string
}

/**
 * Lanza `person.identification_document.taken` si otra persona ya usa ese
 * documento. `ignoreId` es la persona que se modifica.
 */
export async function ensureIdentificationDocumentAvailable(
  input: EnsureIdentificationDocumentAvailableInput,
  run: PostgresQuery = query,
): Promise<void> {
  const identificationDocument = assertNonEmptyString(
    input.identificationDocument,
    'person.identification_document',
  )
  const foundId = await findPersonIdByIdentificationDocument(
    identificationDocument.toLowerCase(),
    run,
  )
  if (!foundId) {
    return
  }

  if (
    input.ignoreId === undefined ||
    normalizeUuid(foundId) !== normalizeUuid(input.ignoreId)
  ) {
    fail('person.identification_document', 'taken')
  }
}

export type EnsurePersonCanBeRemovedInput = {
  id: string
}

/**
 * Lanza `person.protected` si la persona es organization_admin y
 * `person.enrolled` si es teacher y está en algún curso. Un student sí se borra:
 * sus matrículas se quitan en la misma transacción.
 */
export async function ensurePersonCanBeRemoved(
  input: EnsurePersonCanBeRemovedInput,
  run: PostgresQuery = query,
): Promise<void> {
  const roles = await retrieveAllRolesByPersonId(input.id, run)
  const names = roles.map((role) => role.name)

  if (names.includes('organization_admin')) {
    fail('person', 'protected')
  }

  if (names.includes('teacher') && (await personHasCourses(input.id, run))) {
    fail('person', 'enrolled')
  }
}
