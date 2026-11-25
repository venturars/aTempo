export type DomainErrorKind =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CONFIGURATION'
  | 'PERSISTENCE'

export type DomainErrorOptions = {
  kind: DomainErrorKind
  id: string
  entity?: string
  field?: string
  cause?: Error
}

export class DomainError extends Error {
  readonly kind: DomainErrorKind
  readonly id: string
  readonly entity?: string
  readonly field?: string

  constructor(message: string, options: DomainErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = new.target.name
    this.kind = options.kind
    this.id = options.id
    this.entity = options.entity
    this.field = options.field
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'kind'>) {
    super(message, { ...options, kind: 'VALIDATION' })
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'kind'>) {
    super(message, { ...options, kind: 'NOT_FOUND' })
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'kind'>) {
    super(message, { ...options, kind: 'CONFLICT' })
  }
}

export class ConfigurationError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'kind'>) {
    super(message, { ...options, kind: 'CONFIGURATION' })
  }
}

export class PersistenceError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'kind'>) {
    super(message, { ...options, kind: 'PERSISTENCE' })
  }
}

export function labelParts(label: string): { entity?: string; field?: string } {
  const separator = label.indexOf('.')
  if (separator === -1) {
    return { entity: label }
  }

  return {
    entity: label.slice(0, separator),
    field: label.slice(separator + 1),
  }
}
