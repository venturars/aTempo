import {
  ConflictError,
  ConfigurationError,
  NotFoundError,
  PersistenceError,
} from '../src/errors'
import { check } from '../src/postgres/check'
import { query } from '../src/postgres/pool'
import { assertMockSql, mockDriver, resetDriver } from './helpers'

describe('postgres', () => {
  afterEach(() => {
    resetDriver()
  })

  it('throws when DATABASE_URL is missing and does not query', async () => {
    resetDriver()
    await expect(check()).rejects.toThrow('Falta DATABASE_URL')
    await expect(check()).rejects.toBeInstanceOf(ConfigurationError)
    await expect(check()).rejects.toMatchObject({
      id: 'postgres.DATABASE_URL.missing_env',
    })
  })

  it('pings with SELECT 1 when the driver succeeds', async () => {
    const calls = mockDriver()
    await expect(check()).resolves.toEqual({ ok: true })
    expect(calls).toEqual([{ sql: 'SELECT 1', params: [] }])
  })

  it('fails the ping when the driver rejects', async () => {
    mockDriver(async () => {
      throw new Error('connection refused')
    })
    await expect(check()).rejects.toBeInstanceOf(PersistenceError)
    await expect(check()).rejects.toMatchObject({
      id: 'postgres.unmapped',
      message: 'error de PostgreSQL',
      cause: expect.objectContaining({ message: 'connection refused' }),
    })
  })

  it('query uses the substituted driver', async () => {
    const calls = mockDriver()
    await query('SELECT 1')
    expect(calls).toHaveLength(1)
  })

  it('rejects SQL that is missing RETURNING, uuid casts or to_char', () => {
    expect(() => assertMockSql('INSERT INTO person VALUES (1)')).toThrow(
      'INSERT/UPDATE debe llevar RETURNING',
    )
    expect(() =>
      assertMockSql('UPDATE person SET email = $2 WHERE id = $1 RETURNING *'),
    ).toThrow('el uuid debe ir con ::uuid')
    expect(() =>
      assertMockSql('SELECT start_at FROM course WHERE id = $1::uuid'),
    ).toThrow('la lectura de course debe proyectar to_char')
    expect(() =>
      assertMockSql('SELECT birth_date FROM person WHERE id = $1::uuid'),
    ).toThrow('la lectura de person debe proyectar to_char de birth_date')
    expect(() => assertMockSql('SELCT 1')).toThrow('consulta no reconocida')
    expect(() =>
      assertMockSql('DELETE FROM person WHERE id = $10::uuid'),
    ).not.toThrow()
  })

  it('translates unique and foreign key errors from pg', async () => {
    mockDriver(async () => {
      throw Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'person_email_key',
      })
    })
    await expect(query('SELECT 1')).rejects.toThrow('person.email ya existe')
    await expect(query('SELECT 1')).rejects.toBeInstanceOf(ConflictError)
    await expect(query('SELECT 1')).rejects.toMatchObject({
      id: 'person.email.taken',
    })

    mockDriver(async () => {
      throw Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'organization_tax_id_lower_idx',
      })
    })
    await expect(query('SELECT 1')).rejects.toThrow(
      'organization.tax_id ya existe',
    )

    mockDriver(async () => {
      throw Object.assign(new Error('foreign key'), {
        code: '23503',
        constraint: 'course_organization_id_fkey',
      })
    })
    await expect(query('SELECT 1')).rejects.toThrow('organization no existe')
    await expect(query('SELECT 1')).rejects.toBeInstanceOf(NotFoundError)
    await expect(query('SELECT 1')).rejects.toMatchObject({
      id: 'organization.missing',
    })
  })
})
