import {
  DOMAIN_ERROR_MESSAGES,
  DOMAIN_ERROR_REASONS,
  type DomainErrorReason,
  type DomainErrorId,
  type DomainLabel,
} from './catalog'
import {
  ConflictError,
  ConfigurationError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  labelParts,
  type DomainError,
  type DomainErrorKind,
} from './domain-error'

const ERROR_BY_KIND: Record<
  DomainErrorKind,
  new (
    message: string,
    options: {
      id: DomainErrorId
      entity?: string
      field?: string
      cause?: Error
    },
  ) => DomainError
> = {
  VALIDATION: ValidationError,
  NOT_FOUND: NotFoundError,
  CONFLICT: ConflictError,
  CONFIGURATION: ConfigurationError,
  PERSISTENCE: PersistenceError,
}

export function domainError(
  label: DomainLabel,
  reason: DomainErrorReason,
  options: { cause?: Error } = {},
): DomainError {
  const id: DomainErrorId = `${label}.${reason}`
  const spec = DOMAIN_ERROR_REASONS[reason]
  const message = DOMAIN_ERROR_MESSAGES[id] ?? spec.message(label)
  const ErrorClass = ERROR_BY_KIND[spec.kind]
  return new ErrorClass(message, {
    id,
    ...labelParts(label),
    cause: options.cause,
  })
}

export function fail(
  label: DomainLabel,
  reason: DomainErrorReason,
  options: { cause?: Error } = {},
): never {
  throw domainError(label, reason, options)
}
