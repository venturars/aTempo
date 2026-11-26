import type { Course } from '../../shared/types/course'
import {
  assertNonEmptyString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from '../../shared/validation/assert'

/**
 * Lee una fila de course que viene de PostgreSQL. El esquema ya garantiza
 * `end_at > start_at` y `to_char` ya da las fechas en ISO UTC, así que solo se
 * comprueba la forma. Una fecha que la entrada no aceptaría (un año de cinco
 * cifras) no rompe el listado entero.
 */
export function courseFromRow(value: unknown): Course {
  const row = assertObject(value, 'course')
  const id = assertUuid(row.id, 'course.id')
  const organizationId = assertUuid(
    row.organization_id,
    'course.organization_id',
  )
  return {
    id: normalizeUuid(id),
    organization_id: normalizeUuid(organizationId),
    name: assertString(row.name, 'course.name'),
    acronym: assertString(row.acronym, 'course.acronym'),
    start_at: assertNonEmptyString(row.start_at, 'course.start_at'),
    end_at: assertNonEmptyString(row.end_at, 'course.end_at'),
    contract_address: assertNonEmptyString(
      row.contract_address,
      'course.contract_address',
    ),
  }
}
