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

export async function withTransaction<T>(
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  if (queryOverride) {
    await queryOverride('BEGIN')
    try {
      const value = await fn(queryOverride)
      await queryOverride('COMMIT')
      return value
    } catch (error) {
      try {
        await queryOverride('ROLLBACK')
      } catch {
        // El error original importa más que un ROLLBACK que también falle.
      }
      throw error
    }
  }

  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const value = await fn((sql, params = []) => client.query(sql, params))
    await client.query('COMMIT')
    return value
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // El error original importa más que un ROLLBACK que también falle.
    }
    throw error
  } finally {
    client.release()
  }
}

function dropPool(): Pool | undefined {
  const current = pool
  pool = undefined
  return current
}

export async function closePool(): Promise<void> {
  const current = dropPool()
  if (current) {
    await current.end()
  }
}

/** Sustituye el driver en los tests. PostgreSQL no tiene que estar en marcha. */
export function substituteQuery(fn: QueryFn | undefined): void {
  queryOverride = fn
}

export function resetDb(): void {
  queryOverride = undefined
  const current = dropPool()
  if (current) {
    void current.end()
  }
}
