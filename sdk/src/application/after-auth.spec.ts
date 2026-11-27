import { InMemoryPersonRepository } from '../infrastructure/in-memory-person-repository'
import { healthUrl } from '../infrastructure/postgres-health-client'
import { AppError } from '../shared/app-error'
import { createSdk } from '../composition/create-sdk'
import { asEmail } from '../domain/email'
import { asIdentificationDocument } from '../domain/identifier'
import { Person } from '../domain/person'
import { asUuid } from '../domain/scalars'
import { asNonEmptyText } from '../domain/text'

const POSTGRES_URL = 'http://api-postgresql:3001'

function okHealth() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ status: 'ok', postgres: 'ok' }),
  }
}

function teacher(): Person {
  return {
    id: asUuid('11111111-1111-1111-1111-111111111111'),
    organizationId: asUuid('22222222-2222-2222-2222-222222222222'),
    email: asEmail('profesor@atempo.test'),
    firstName: asNonEmptyText('Ventura'),
    lastName: asNonEmptyText('Rodríguez'),
    identificationDocument: asIdentificationDocument('12345678A'),
    birthDate: null,
    phone: null,
    roles: ['teacher'],
    invitationStatus: 'active',
  }
}

describe('afterAuth', () => {
  it('rejects empty email without fetch', async () => {
    const fetch = jest.fn()
    const { afterAuth, persons } = createSdk({
      fetch,
      readPostgresApiUrl: () => POSTGRES_URL,
    })

    const result = await afterAuth({ email: '   ' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBeInstanceOf(AppError)
    expect(result.error.code).toBe('VALIDATION')
    expect(fetch).not.toHaveBeenCalled()
    expect(persons.size()).toBe(0)
  })

  it('normalizes email and reads health', async () => {
    const fetch = jest.fn().mockResolvedValue(okHealth())
    const persons = new InMemoryPersonRepository([teacher()])
    const { afterAuth } = createSdk({
      fetch,
      persons,
      readPostgresApiUrl: () => `${POSTGRES_URL}/`,
    })

    const result = await afterAuth({ email: '  Profesor@aTempo.TEST ' })

    expect(result).toEqual({
      ok: true,
      value: { email: 'profesor@atempo.test', person: teacher() },
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(healthUrl(POSTGRES_URL))
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'GET' })
  })

  it('maps failed health to persistence AppError', async () => {
    const fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ status: 'error', postgres: 'error' }),
    })
    const { afterAuth, persons } = createSdk({
      fetch,
      readPostgresApiUrl: () => POSTGRES_URL,
    })

    const result = await afterAuth({ email: 'ada.lopez@clase.test' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBeInstanceOf(AppError)
    expect(result.error.code).toBe('PERSISTENCE')
    expect(persons.size()).toBe(0)
  })

  it('maps health body that is not ok to persistence AppError', async () => {
    const fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'error', postgres: 'error' }),
    })
    const { afterAuth } = createSdk({
      fetch,
      readPostgresApiUrl: () => POSTGRES_URL,
    })

    const result = await afterAuth({ email: 'ada.lopez@clase.test' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('PERSISTENCE')
  })

  it('maps missing postgres url to configuration AppError without fetch', async () => {
    const fetch = jest.fn()
    const { afterAuth } = createSdk({
      fetch,
      readPostgresApiUrl: () => '  ',
    })

    const result = await afterAuth({ email: 'ada.lopez@clase.test' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('CONFIGURATION')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('maps network failure to persistence AppError', async () => {
    const fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const { afterAuth } = createSdk({
      fetch,
      readPostgresApiUrl: () => POSTGRES_URL,
    })

    const result = await afterAuth({ email: 'ada.lopez@clase.test' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('PERSISTENCE')
    expect(result.error.cause).toEqual(new Error('ECONNREFUSED'))
  })

  it('maps health timeout to persistence AppError', async () => {
    const fetch = jest
      .fn()
      .mockImplementation((_input: string, init?: { signal?: AbortSignal }) => {
        const signal = init?.signal
        if (signal?.aborted) {
          return Promise.reject(signal.reason)
        }
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(signal.reason)
          })
        })
      })
    const { afterAuth } = createSdk({
      fetch,
      readPostgresApiUrl: () => POSTGRES_URL,
      healthTimeoutMs: 1,
    })

    const result = await afterAuth({ email: 'ada.lopez@clase.test' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('PERSISTENCE')
  })

  it('returns ok with absent person and does not create one', async () => {
    const fetch = jest.fn().mockResolvedValue(okHealth())
    const { afterAuth, persons } = createSdk({
      fetch,
      readPostgresApiUrl: () => POSTGRES_URL,
    })

    const result = await afterAuth({ email: 'nuevo@atempo.test' })

    expect(result).toEqual({
      ok: true,
      value: { email: 'nuevo@atempo.test', person: null },
    })
    expect(persons.size()).toBe(0)
    expect(await persons.findByEmail('nuevo@atempo.test')).toBeNull()
  })
})
