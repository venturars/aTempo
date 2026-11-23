import { afterAuth } from '../src/after-auth'
import { ConfigurationError, PersistenceError, ValidationError } from '../src/errors'
import { substituteFetch } from '../src/http'

const postgresApi = 'http://api-postgresql.test'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('afterAuth', () => {
  const originalUrl = process.env.API_POSTGRESQL_URL
  let fetchMock: jest.Mock

  beforeEach(() => {
    process.env.API_POSTGRESQL_URL = postgresApi
    fetchMock = jest.fn()
    substituteFetch(fetchMock)
  })

  afterEach(() => {
    substituteFetch(undefined)
    if (originalUrl === undefined) delete process.env.API_POSTGRESQL_URL
    else process.env.API_POSTGRESQL_URL = originalUrl
  })

  it('rejects an empty email without calling api-postgresql', async () => {
    await expect(afterAuth({ email: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizes the email and returns postgres health', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok', postgres: 'ok' }))

    const result = await afterAuth({ email: ' Ada@Clase.test ' })

    expect(result).toEqual({
      identity: { email: 'ada@clase.test' },
      postgres: { status: 'ok' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(`${postgresApi}/health`)
    expect(options).toMatchObject({ method: 'GET' })
  })

  it('throws when API_POSTGRESQL_URL is missing', async () => {
    delete process.env.API_POSTGRESQL_URL
    await expect(afterAuth({ email: 'ada@clase.test' })).rejects.toBeInstanceOf(
      ConfigurationError,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when health is not ok', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: 'error', postgres: 'error' }, 503),
    )
    await expect(afterAuth({ email: 'ada@clase.test' })).rejects.toBeInstanceOf(
      PersistenceError,
    )
  })

  it('throws when api-postgresql cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('network unavailable'))
    await expect(afterAuth({ email: 'ada@clase.test' })).rejects.toBeInstanceOf(
      PersistenceError,
    )
  })
})
