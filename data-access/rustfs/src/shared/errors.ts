import {
  createErrorFactory,
  type DomainError,
  type DomainErrorKind,
} from '@atempo/errors'

export const ERROR_REASONS = {
  string: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser un string`,
  },
  empty: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser un string no vacío`,
  },
  uuid: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser un uuid`,
  },
  bytes: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser bytes`,
  },
  object: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser un objeto`,
  },
  taken: {
    kind: 'CONFLICT',
    message: (label: string) => `${label} ya existe`,
  },
  not_read: {
    kind: 'PERSISTENCE',
    message: (label: string) => `${label} no se ha leído`,
  },
  missing_bucket: {
    kind: 'PERSISTENCE',
    message: (label: string) => `${label} no existe`,
  },
  unmapped: {
    kind: 'PERSISTENCE',
    message: () => 'error de RustFS',
  },
  missing_env: {
    kind: 'CONFIGURATION',
    message: (label: string) => `Falta ${label.slice(label.indexOf('.') + 1)}`,
  },
  invalid_env: {
    kind: 'CONFIGURATION',
    message: (label: string) =>
      `${label.slice(label.indexOf('.') + 1)} tiene un valor inválido`,
  },
} as const satisfies Record<
  string,
  { kind: DomainErrorKind; message: (label: string) => string }
>

export type ErrorReasonName = keyof typeof ERROR_REASONS

export const ERROR_LABELS = [
  'justification',
  'justification.id',
  'justification.document_id',
  'justification.content_type',
  'justification.body',
  'justification.etag',
  'rustfs',
  'rustfs.bucket',
  'rustfs.RUSTFS_ENDPOINT',
  'rustfs.RUSTFS_PORT',
  'rustfs.RUSTFS_USE_SSL',
  'rustfs.RUSTFS_ACCESS_KEY',
  'rustfs.RUSTFS_SECRET_KEY',
] as const

export type ErrorLabel = (typeof ERROR_LABELS)[number]

export type ErrorId = `${ErrorLabel}.${ErrorReasonName}`

export const ERROR_MESSAGES: { readonly [K in ErrorId]?: string } = {
  'rustfs.bucket.missing_bucket': 'el bucket justifications no existe',
  'rustfs.RUSTFS_ENDPOINT.invalid_env':
    'RUSTFS_ENDPOINT tiene que ser solo el host, sin esquema ni puerto (por ejemplo rustfs o 127.0.0.1)',
  'rustfs.RUSTFS_PORT.invalid_env':
    'RUSTFS_PORT tiene que ser un número de 1 a 65535',
  'rustfs.RUSTFS_USE_SSL.invalid_env':
    'RUSTFS_USE_SSL tiene que ser true, false, 1 o 0',
}

const factory = createErrorFactory({
  labels: ERROR_LABELS,
  reasons: ERROR_REASONS,
  messages: ERROR_MESSAGES,
})

export const buildError: (
  label: ErrorLabel,
  reason: ErrorReasonName,
  options?: { cause?: Error },
) => DomainError = factory.domainError

/**
 * Lleva su tipo escrito: TypeScript solo estrecha después de una llamada que
 * devuelve `never` si la función tiene un tipo explícito.
 */
export const fail: (
  label: ErrorLabel,
  reason: ErrorReasonName,
  options?: { cause?: Error },
) => never = factory.fail
