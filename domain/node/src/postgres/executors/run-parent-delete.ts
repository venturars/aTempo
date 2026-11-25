import type { QueryResult, QueryResultRow } from 'pg'
import { domainError } from '../../errors'
import type { PostgresQuery, PostgresQueryParam } from '../pool'

const FOREIGN_KEY_VIOLATION = '23503'

/**
 * Ejecuta el DELETE de una fila padre (person, course u organization).
 * Si choca con una clave foránea, todavía hay filas hijas que la usan: es un
 * conflicto, no una fila que falta. El error de pg no dice si vino de un
 * INSERT o de un DELETE; por eso se traduce aquí, donde sí se sabe.
 */
export async function runParentDelete(
  run: PostgresQuery,
  sql: string,
  params: PostgresQueryParam[],
  parent: 'organization' | 'person' | 'course',
): Promise<QueryResult<QueryResultRow>> {
  try {
    return await run(sql, params)
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw domainError(parent, 'referenced', { cause: error })
    }
    throw error
  }
}

function isForeignKeyViolation(error: unknown): error is Error {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === FOREIGN_KEY_VIOLATION
  )
}
