const mockEnd = jest.fn(async () => undefined)
const mockRelease = jest.fn()
const mockClientQuery = jest.fn()
const mockPoolQuery = jest.fn()
const mockConnect = jest.fn()
const mockOn = jest.fn()
const mockClientOn = jest.fn()
const mockClientOff = jest.fn()

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockPoolQuery,
    connect: mockConnect,
    end: mockEnd,
    on: mockOn,
  })),
}))

import { removePerson } from '../src/person/remove-person'
import { closePool, query, resetDb } from '../src/postgres/pool'
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
    mockOn.mockClear()
    mockClientOn.mockReset()
    mockClientOff.mockReset()
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
      on: mockClientOn,
      off: mockClientOff,
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

  it('an idle client error is logged and does not crash Node', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    await query('SELECT 1')
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))

    const [, onPoolError] = mockOn.mock.calls[0]
    const failure = new Error('Connection terminated unexpectedly')
    expect(() => onPoolError(failure)).not.toThrow()
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), failure)

    consoleError.mockRestore()
  })

  it('withTransaction commits on one client and releases it', async () => {
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return emptyResult()
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).resolves.toEqual({
      deleted: true,
    })
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
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
      cause: expect.objectContaining({ message: 'timeout' }),
    })
    expect(clientSql()).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'ROLLBACK',
    ])
    expect(mockRelease).toHaveBeenCalledWith(undefined)
  })

  it('withTransaction turns a failed connect into postgres.unmapped', async () => {
    mockConnect.mockRejectedValue(
      new Error('timeout exceeded when trying to connect'),
    )
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
      cause: expect.objectContaining({
        message: 'timeout exceeded when trying to connect',
      }),
    })
    expect(mockClientQuery).not.toHaveBeenCalled()
  })

  it('withTransaction destroys the client when ROLLBACK also fails', async () => {
    const rollbackFailure = new Error('Connection terminated')
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('DELETE FROM person WHERE')) {
        throw new Error('timeout')
      }
      if (sql === 'ROLLBACK') {
        throw rollbackFailure
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
      cause: expect.objectContaining({ message: 'timeout' }),
    })
    expect(mockRelease).toHaveBeenCalledWith(rollbackFailure)
  })

  it('a DELETE blocked by child rows is a conflict, not a missing person', async () => {
    // Forma real de pg: `table` es la tabla hija también en un DELETE.
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('DELETE FROM person WHERE')) {
        throw Object.assign(new Error('update or delete on table "person"'), {
          code: '23503',
          constraint: 'person_course_person_id_fkey',
          table: 'person_course',
        })
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      code: 'CONFLICT',
      id: 'person.referenced',
    })
    expect(clientSql()).toContain('ROLLBACK')
  })

  it('a connection that breaks inside a transaction is logged and destroyed', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const socketFailure = new Error('Connection terminated unexpectedly')
    mockClientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('DELETE FROM person WHERE')) {
        const [, onClientError] = mockClientOn.mock.calls[0]
        expect(() => onClientError(socketFailure)).not.toThrow()
        throw socketFailure
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
    })
    expect(mockClientOn).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockClientOff).toHaveBeenCalledWith(
      'error',
      mockClientOn.mock.calls[0][1],
    )
    expect(mockRelease).toHaveBeenCalledWith(socketFailure)
    consoleError.mockRestore()
  })
})
