import { query } from '../src/postgres/db'
import { check } from '../src/postgres/postgres'
import { assertMockSql, mockDriver, resetDriver } from './helpers'

describe('postgres', () => {
  afterEach(() => {
    resetDriver()
  })

  it('throws when DATABASE_URL is missing and does not query', async () => {
    resetDriver()
    await expect(check()).rejects.toThrow('Falta DATABASE_URL')
  })

  it('pings with SELECT 1 when the driver succeeds', async () => {
    const calls = mockDriver()
    await check()
    expect(calls).toEqual([{ sql: 'SELECT 1', params: [] }])
  })

  it('fails the ping when the driver rejects', async () => {
    mockDriver(async () => {
      throw new Error('connection refused')
    })
    await expect(check()).rejects.toThrow('connection refused')
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
  })
})
