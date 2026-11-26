import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from 'pg'
import { fail } from '../shared/errors'
import { rethrowPg } from './map-error'

export type PostgresQueryParam = string | number | boolean | null

export type PostgresQuery = (
  sql: string,
  params?: PostgresQueryParam[],
) => Promise<QueryResult<QueryResultRow>>

let pool: Pool | undefined
let queryOverride: PostgresQuery | undefined

/**
 * Una conexión puede romperse (PostgreSQL se reinicia o se corta la red).
 * Sin un listener, el evento `error` de la conexión o del pool tumba Node.
 */
function reportConnectionError(error: Error): void {
  console.error('postgres: se ha roto una conexión', error)
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    fail('postgres.DATABASE_URL', 'missing_env')
  }

  if (!pool) {
    pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 })
    // Conexiones que esperan en el pool. pg ya saca la rota: la siguiente query
    // abre otra.
    pool.on('error', reportConnectionError)
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

async function connectClient(): Promise<PoolClient> {
  try {
    return await getPool().connect()
  } catch (error) {
    rethrowPg(error)
  }
}

/**
 * Deshace la transacción. Si el ROLLBACK también falla, devuelve ese error:
 * la conexión ya no sirve y no debe volver al pool.
 */
async function rollback(run: PostgresQuery): Promise<Error | undefined> {
  try {
    await run('ROLLBACK')
    return undefined
  } catch (error) {
    return error instanceof Error ? error : new Error('ROLLBACK fallido')
  }
}

export async function withTransaction<T>(
  fn: (query: PostgresQuery) => Promise<T>,
): Promise<T> {
  if (queryOverride) {
    const run = queryOverride
    try {
      await run('BEGIN')
      const value = await fn(run)
      await run('COMMIT')
      return value
    } catch (error) {
      // El error original importa más que un ROLLBACK que también falle.
      await rollback(run)
      rethrowPg(error)
    }
  }

  const client = await connectClient()
  const run: PostgresQuery = (sql, params = []) => client.query(sql, params)
  let brokenConnection: Error | undefined
  // Mientras la transacción tiene la conexión, el pool no escucha sus errores.
  const onClientError = (error: Error): void => {
    reportConnectionError(error)
    brokenConnection = error
  }
  client.on('error', onClientError)
  try {
    await run('BEGIN')
    const value = await fn(run)
    await run('COMMIT')
    return value
  } catch (error) {
    const rollbackError = await rollback(run)
    brokenConnection = brokenConnection ?? rollbackError
    rethrowPg(error)
  } finally {
    client.off('error', onClientError)
    // release(error) destruye la conexión; release() la devuelve al pool.
    client.release(brokenConnection)
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
