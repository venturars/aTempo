import { parseEmail } from '../domain/email'
import { Person } from '../domain/person'
import { PersonRepository } from '../domain/person-repository'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type AfterAuthInput = { email: string }

export type AfterAuthValue = {
  email: string
  person: Person | null
}

export type AfterAuthDeps = {
  readPostgresApiUrl: () => string | undefined
  checkHealth: (postgresApiUrl: string) => Promise<Result<void>>
  persons: PersonRepository
}

export function createAfterAuth(deps: AfterAuthDeps) {
  return async function afterAuth({
    email,
  }: AfterAuthInput): Promise<Result<AfterAuthValue>> {
    const normalized = parseEmail(email)
    if (!normalized.ok) {
      return normalized
    }

    const postgresApiUrl = deps.readPostgresApiUrl()?.trim()
    if (!postgresApiUrl) {
      return err(new AppError('CONFIGURATION', 'Falta API_POSTGRESQL_URL.'))
    }

    const health = await deps.checkHealth(postgresApiUrl)
    if (!health.ok) {
      return health
    }

    const person = await deps.persons.findByEmail(normalized.value)
    return ok({ email: normalized.value, person })
  }
}