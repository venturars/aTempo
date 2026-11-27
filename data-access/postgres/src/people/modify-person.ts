import { fail } from '../shared/errors'
import { findPersonById, updatePersonRow } from '../postgres/executors/person'
import { withTransaction } from '../postgres/pool'
import { personFromRow } from '../postgres/rows/person'
import { assertUuid, normalizeUuid } from '../shared/validation/assert'
import {
  assertPersonChanges,
  assertPersonUpdate,
  normalizeEmail,
} from '../shared/validation/person'
import type { Person, PersonChanges } from '../shared/types/person'
import {
  ensureEmailAvailable,
  ensureIdentificationDocumentAvailable,
} from './rules'

export type ModifyPersonInput = {
  id: string
  changes: PersonChanges
}

export type ModifyPersonOutput = {
  person: Person
}

/**
 * Cambia solo los campos que vienen en `changes`. Las reglas se comprueban
 * sobre la persona completa, ya con los cambios aplicados.
 */
export async function modifyPerson(
  input: ModifyPersonInput,
): Promise<ModifyPersonOutput> {
  const id = normalizeUuid(assertUuid(input.id, 'person.id'))
  const changes = assertPersonChanges(input.changes)

  const modified = await withTransaction(async (run) => {
    const current = await findPersonById(id, run)
    if (!current) {
      fail('person', 'missing')
    }

    const person = assertPersonUpdate({
      ...personFromRow(current),
      ...changes,
      id,
    })
    const email = normalizeEmail(person.email)
    await ensureIdentificationDocumentAvailable(
      {
        identificationDocument: person.identification_document,
        ignoreId: id,
      },
      run,
    )
    await ensureEmailAvailable({ email, ignoreId: id }, run)

    const row = await updatePersonRow({ ...person, email }, run)
    return personFromRow(row)
  })

  return { person: modified }
}
