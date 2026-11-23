export type DomainErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CONFIGURATION'
  | 'PERSISTENCE'

export type DomainErrorOptions = {
  code: DomainErrorCode
  id: string
  entity?: string
  field?: string
  cause?: Error
}

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly id: string
  readonly entity?: string
  readonly field?: string

  constructor(message: string, options: DomainErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = new.target.name
    this.code = options.code
    this.id = options.id
    this.entity = options.entity
    this.field = options.field
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'code'>) {
    super(message, { ...options, code: 'VALIDATION' })
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'code'>) {
    super(message, { ...options, code: 'NOT_FOUND' })
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'code'>) {
    super(message, { ...options, code: 'CONFLICT' })
  }
}

export class ConfigurationError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'code'>) {
    super(message, { ...options, code: 'CONFIGURATION' })
  }
}

export class PersistenceError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'code'>) {
    super(message, { ...options, code: 'PERSISTENCE' })
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
