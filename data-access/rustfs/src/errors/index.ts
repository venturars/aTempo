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
} from './domain-error'
export {
  DOMAIN_ERROR_MESSAGES,
  DOMAIN_ERROR_REASONS,
  DOMAIN_LABELS,
  type DomainErrorId,
  type DomainErrorReason,
  type DomainLabel,
} from './catalog'
export { domainError, fail } from './fail'
