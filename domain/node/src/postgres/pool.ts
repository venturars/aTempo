import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { fail } from '../errors'
import { rethrowPg } from './map-error'

export type PostgresQueryParam = string | number | boolean | null

export type PostgresQuery = (
  sql: string,
  params?: PostgresQueryParam[],
) => Promise<QueryResult<QueryResultRow>>

let pool: Pool | undefined
let queryOverride: PostgresQuery | undefined

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    fail('postgres.DATABASE_URL', 'missing_env')
  }

  if (!pool) {
    pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 })
  }

  return pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: PostgresQueryParam[] = [],
): Promise<QueryResult<T>> {
  try {
    if (queryOverride) {
      return (await queryOverride(sql, params)) as QueryResult<T>
    }

    return await getPool().query<T>(sql, params)
  } catch (error) {
    rethrowPg(error)
  }
}

export async function withTransaction<T>(
  fn: (query: PostgresQuery) => Promise<T>,
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
      rethrowPg(error)
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
    rethrowPg(error)
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
export function substituteQuery(fn: PostgresQuery | undefined): void {
  queryOverride = fn
}

export function resetDb(): void {
  queryOverride = undefined
  const current = dropPool()
  if (current) {
    void current.end().catch(() => {
      // El pool ya no se usa; un end() fallido no debe colgar Node.
    })
  }
}
