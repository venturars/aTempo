import type { QueryResult, QueryResultRow } from 'pg'
import { fail, type DomainLabel } from '../../shared/errors'

/**
 * Un INSERT, UPDATE o DELETE con RETURNING devuelve la fila que ha tocado. Si
 * no llega ninguna, no ha ocurrido nada: se lanza en vez de devolver null.
 * En un DELETE eso significa que la fila no existía (`missing`).
 */
export function requireRow<T>(
  result: QueryResult<QueryResultRow>,
  label: DomainLabel,
  reason: 'not_created' | 'not_updated' | 'missing',
): T {
  const row = result.rows[0]
  if (row === undefined) {
    fail(label, reason)
  }
  return row as T
}
