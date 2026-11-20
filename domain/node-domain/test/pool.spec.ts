const mockEnd = jest.fn(async () => undefined)
const mockRelease = jest.fn()
const mockClientQuery = jest.fn()
const mockPoolQuery = jest.fn()
const mockConnect = jest.fn()

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockPoolQuery,
    connect: mockConnect,
    end: mockEnd,
  })),
}))

import { deletePerson } from '../src/person/delete-person'
import { closePool, query, resetDb } from '../src/postgres/db'
import { commandResult, emptyResult, PERSON_ID } from './helpers'

function clientSql(): string[] {
  return mockClientQuery.mock.calls.map((call) => String(call[0]))
}

describe('pool', () => {
  beforeEach(() => {
    mockEnd.mockClear()
    mockRelease.mockClear()
    mockClientQuery.mockReset()
    mockPoolQuery.mockReset()
    mockConnect.mockReset()
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
    })
    mockPoolQuery.mockResolvedValue(emptyResult())
    process.env.DATABASE_URL = 'postgres://localhost/atempo'
  })

  afterEach(() => {
    resetDb()
    delete process.env.DATABASE_URL
  })

  it('resetDb closes the pool', async () => {
    await query('SELECT 1')
    resetDb()
    expect(mockEnd).toHaveBeenCalled()
  })

  it('closePool ends the pool', async () => {
    await query('SELECT 1')
    await closePool()
    expect(mockEnd).toHaveBeenCalled()
  })

  it('withTransaction commits on one client and releases it', async () => {
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return emptyResult()
      }
      return commandResult(1)
    })
    await expect(deletePerson(PERSON_ID)).resolves.toBe(true)
    expect(clientSql()).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'COMMIT',
    ])
    expect(mockRelease).toHaveBeenCalled()
    expect(mockPoolQuery).not.toHaveBeenCalled()
  })

  it('withTransaction rolls back on one client and releases it', async () => {
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('DELETE FROM person WHERE')) {
        throw new Error('timeout')
      }
      return commandResult(1)
    })
    await expect(deletePerson(PERSON_ID)).rejects.toThrow('timeout')
    expect(clientSql()).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'ROLLBACK',
    ])
    expect(mockRelease).toHaveBeenCalled()
  })
})
