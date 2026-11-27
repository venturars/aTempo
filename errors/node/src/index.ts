export {
  ConflictError,
  ConfigurationError,
  DomainError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  labelParts,
  type DomainErrorKind,
  type DomainErrorOptions,
} from './errors'
export {
  createErrorFactory,
  type ErrorCatalog,
  type ErrorFactory,
  type ErrorReason,
} from './fail'
