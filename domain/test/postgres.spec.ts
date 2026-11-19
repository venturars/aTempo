import { query } from '../src/postgres/db'
import { check } from '../src/postgres/postgres'
import { mockDriver, resetDriver } from './helpers'

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
})
