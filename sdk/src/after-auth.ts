import {
  ConfigurationError,
  PersistenceError,
  ValidationError,
} from './errors'
import { send } from './http'

export type Identity = { email: string }

export type AfterAuthResult = {
  identity: Identity
  postgres: { status: string }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function postgresApiUrl(): string {
  const base = process.env.API_POSTGRESQL_URL?.trim()
  if (!base) {
    throw new ConfigurationError('API_POSTGRESQL_URL is missing')
  }
  return base.replace(/\/+$/, '')
}

function isOkHealth(value: unknown): value is { status: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value as { status: unknown }).status === 'ok'
  )
}

export async function afterAuth(identity: Identity): Promise<AfterAuthResult> {
  const email = normalizeEmail(identity.email)
  if (email.length === 0) {
    throw new ValidationError('email is required')
  }

  const healthUrl = `${postgresApiUrl()}/health`
  let response: Response
  try {
    response = await send(healthUrl, { method: 'GET' })
  } catch {
    throw new PersistenceError('api-postgresql is unavailable')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok || !isOkHealth(body)) {
    throw new PersistenceError('api-postgresql health failed')
  }

  return {
    identity: { email },
    postgres: { status: body.status },
  }
}
