export type DomainErrorType =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CONFIGURATION'
  | 'PERSISTENCE'

export type DomainErrorOptions = {
  type: DomainErrorType
  id: string
  entity?: string
  field?: string
  cause?: Error
}

export class DomainError extends Error {
  readonly type: DomainErrorType
  readonly id: string
  readonly entity?: string
  readonly field?: string

  constructor(message: string, options: DomainErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = new.target.name
    this.type = options.type
    this.id = options.id
    this.entity = options.entity
    this.field = options.field
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'type'>) {
    super(message, { ...options, type: 'VALIDATION' })
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'type'>) {
    super(message, { ...options, type: 'NOT_FOUND' })
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'type'>) {
    super(message, { ...options, type: 'CONFLICT' })
  }
}

export class ConfigurationError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'type'>) {
    super(message, { ...options, type: 'CONFIGURATION' })
  }
}

export class PersistenceError extends DomainError {
  constructor(message: string, options: Omit<DomainErrorOptions, 'type'>) {
    super(message, { ...options, type: 'PERSISTENCE' })
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
