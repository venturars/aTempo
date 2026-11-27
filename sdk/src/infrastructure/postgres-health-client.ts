import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type FetchLike = (
  input: string,
  init?: { method?: string; signal?: AbortSignal },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export type PostgresHealthClientInput = {
  fetch: FetchLike
  timeoutMs?: number
}

const UNAVAILABLE = 'api-postgresql no está disponible.'

export function healthUrl(postgresApiUrl: string): string {
  return `${postgresApiUrl.replace(/\/+$/, '')}/health`
}

export function createPostgresHealthClient(input: PostgresHealthClientInput) {
  const timeoutMs = input.timeoutMs ?? 5000

  return async function checkHealth(
    postgresApiUrl: string,
  ): Promise<Result<void>> {
    try {
      const response = await input.fetch(healthUrl(postgresApiUrl), {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) {
        return err(new AppError('PERSISTENCE', UNAVAILABLE, response.status))
      }
      const body = (await response.json()) as { status?: string }
      if (body.status !== 'ok') {
        return err(new AppError('PERSISTENCE', UNAVAILABLE, body))
      }
      return ok(undefined)
    } catch (cause) {
      return err(new AppError('PERSISTENCE', UNAVAILABLE, cause))
    }
  }
}
