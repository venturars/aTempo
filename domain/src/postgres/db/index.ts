import { Pool, type QueryResult, type QueryResultRow } from 'pg'

export type QueryFn = (
  sql: string,
  params?: unknown[],
) => Promise<QueryResult<QueryResultRow>>

let pool: Pool | undefined
let queryOverride: QueryFn | undefined

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL')
  }

  if (!pool) {
    pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 })
  }

  return pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  if (queryOverride) {
    return queryOverride(sql, params) as Promise<QueryResult<T>>
  }

  return getPool().query<T>(sql, params)
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = undefined
  }
}

/** Sustituye el driver en los tests. PostgreSQL no tiene que estar en marcha. */
export function substituteQuery(fn: QueryFn | undefined): void {
  queryOverride = fn
}

export function resetDb(): void {
  pool = undefined
  queryOverride = undefined
}
