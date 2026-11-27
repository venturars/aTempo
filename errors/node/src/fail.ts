import {
  ConflictError,
  ConfigurationError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  labelParts,
  type DomainError,
  type DomainErrorKind,
  type DomainErrorOptions,
} from './errors'

export interface ErrorReason {
  kind: DomainErrorKind
  message: (label: string) => string
}

export interface ErrorCatalog<L extends string, R extends string> {
  labels: readonly L[]
  reasons: Record<R, ErrorReason>
  messages?: { readonly [K in `${L}.${R}`]?: string }
}

export interface ErrorFactory<L extends string, R extends string> {
  domainError: (label: L, reason: R, options?: { cause?: Error }) => DomainError
  fail: (label: L, reason: R, options?: { cause?: Error }) => never
}

const ERROR_BY_KIND: Record<
  DomainErrorKind,
  new (
    message: string,
    options: Omit<DomainErrorOptions, 'kind'>,
  ) => DomainError
> = {
  VALIDATION: ValidationError,
  NOT_FOUND: NotFoundError,
  CONFLICT: ConflictError,
  CONFIGURATION: ConfigurationError,
  PERSISTENCE: PersistenceError,
}

export function createErrorFactory<L extends string, R extends string>(
  catalog: ErrorCatalog<L, R>,
): ErrorFactory<L, R> {
  function domainError(
    label: L,
    reason: R,
    options: { cause?: Error } = {},
  ): DomainError {
    const id: `${L}.${R}` = `${label}.${reason}`
    const spec = catalog.reasons[reason]
    const message = catalog.messages?.[id] ?? spec.message(label)
    const ErrorClass = ERROR_BY_KIND[spec.kind]
    return new ErrorClass(message, {
      id,
      ...labelParts(label),
      cause: options.cause,
    })
  }

  function fail(label: L, reason: R, options: { cause?: Error } = {}): never {
    throw domainError(label, reason, options)
  }

  return { domainError, fail }
}
