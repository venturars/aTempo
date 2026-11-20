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

function pgField(
  error: unknown,
  field: 'code' | 'constraint',
): string | undefined {
  if (typeof error !== 'object' || error === null || !(field in error)) {
    return undefined
  }
  const value = (error as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}

function domainErrorFromPg(error: unknown): Error | undefined {
  const code = pgField(error, 'code')
  const constraint = pgField(error, 'constraint') ?? ''

  if (code === '23505') {
    if (constraint.includes('email')) {
      return new Error('person.email ya existe')
    }
    if (constraint.includes('identification_document')) {
      return new Error('person.identification_document ya existe')
    }
    if (constraint.includes('tax_id')) {
      return new Error('organization.tax_id ya existe')
    }
    if (constraint.includes('contract_address')) {
      return new Error('course.contract_address ya existe')
    }
    if (constraint.includes('acronym')) {
      return new Error('course.acronym ya existe en la organización')
    }
    if (constraint === 'person_course_pkey') {
      return new Error('person_course ya existe')
    }
    if (constraint === 'person_role_pkey') {
      return new Error('person_role ya existe')
    }
  }

  if (code === '23503') {
    if (constraint === 'course_organization_id_fkey') {
      return new Error('organization no existe')
    }
    if (
      constraint === 'person_course_person_id_fkey' ||
      constraint === 'person_role_person_id_fkey'
    ) {
      return new Error('person no existe')
    }
    if (constraint === 'person_course_course_id_fkey') {
      return new Error('course no existe')
    }
  }

  return undefined
}

function rethrowPg(error: unknown): never {
  throw domainErrorFromPg(error) ?? error
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
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
export function substituteQuery(fn: QueryFn | undefined): void {
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
