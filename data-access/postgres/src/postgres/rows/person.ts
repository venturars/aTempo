import type { Person } from '../../shared/types/person'
import {
  assertNullableString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from '../../shared/validation/assert'

/**
 * Lee una fila de person que viene de PostgreSQL. Solo se comprueba la forma:
 * un valor guardado que la entrada no aceptaría (un `birth_date` con un año de
 * cinco cifras, un documento vacío) no rompe el listado entero.
 */
export function personFromRow(value: unknown): Person {
  const row = assertObject(value, 'person')
  const id = assertUuid(row.id, 'person.id')
  return {
    id: normalizeUuid(id),
    identification_document: assertString(
      row.identification_document,
      'person.identification_document',
    ),
    email: assertString(row.email, 'person.email'),
    first_name: assertString(row.first_name, 'person.first_name'),
    last_name: assertString(row.last_name, 'person.last_name'),
    birth_date: assertNullableString(row.birth_date, 'person.birth_date'),
    phone: assertNullableString(row.phone, 'person.phone'),
  }
}
