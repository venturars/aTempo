export class ValidationError extends Error {
  readonly code = 'VALIDATION'

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConfigurationError extends Error {
  readonly code = 'CONFIGURATION'

  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class PersistenceError extends Error {
  readonly code = 'PERSISTENCE'

  constructor(message: string) {
    super(message)
    this.name = 'PersistenceError'
  }
}
