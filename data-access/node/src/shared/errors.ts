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
  date: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser una fecha`,
  },
  instant: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser una fecha con zona horaria`,
  },
  object: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser un objeto`,
  },
  nullable_string: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser string o null`,
  },
  format: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} tiene un formato inválido`,
  },
  order: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} debe ser posterior a course.start_at`,
  },
  taken: {
    kind: 'CONFLICT',
    message: (label: string) => `${label} ya existe`,
  },
  exclusive: {
    kind: 'CONFLICT',
    message: () => 'un student no puede llevar otro rol',
  },
  missing: {
    kind: 'NOT_FOUND',
    message: (label: string) => `${label} no existe`,
  },
  referenced: {
    kind: 'CONFLICT',
    message: (label: string) => `${label} todavía tiene filas que lo usan`,
  },
  no_changes: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} no trae ningún cambio`,
  },
  unknown_field: {
    kind: 'VALIDATION',
    message: (label: string) =>
      `${label} trae un campo que no se puede cambiar`,
  },
  unchanged: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} no cambia`,
  },
  protected: {
    kind: 'CONFLICT',
    message: (label: string) => `${label} no se puede cambiar`,
  },
  enrolled: {
    kind: 'CONFLICT',
    message: (label: string) =>
      `${label} no se puede cambiar mientras la persona esté en algún curso`,
  },
  role_required: {
    kind: 'CONFLICT',
    message: (label: string) => `${label} necesita una persona con otro rol`,
  },
  not_created: {
    kind: 'PERSISTENCE',
    message: (label: string) => `${label} no se ha creado`,
  },
  not_updated: {
    kind: 'PERSISTENCE',
    message: (label: string) => `${label} no se ha actualizado`,
  },
  unmapped: {
    kind: 'PERSISTENCE',
    message: () => 'error de PostgreSQL',
  },
  missing_env: {
    kind: 'CONFIGURATION',
    message: (label: string) => `Falta ${label.slice(label.indexOf('.') + 1)}`,
  },
} as const satisfies Record<
  string,
  { kind: DomainErrorKind; message: (label: string) => string }
>

export type ErrorReasonName = keyof typeof ERROR_REASONS

export const ERROR_LABELS = [
  'organization',
  'organization.id',
  'organization.name',
  'organization.tax_id',
  'person',
  'person.id',
  'person.email',
  'person.identification_document',
  'person.first_name',
  'person.last_name',
  'person.birth_date',
  'person.phone',
  'course',
  'course.id',
  'course.organization_id',
  'course.name',
  'course.acronym',
  'course.start_at',
  'course.end_at',
  'course.contract_address',
  'person_course',
  'person_course.person_id',
  'person_course.course_id',
  'person_role',
  'person_role.person_id',
  'person_role.role',
  'person_role.student',
  'role',
  'role.name',
  'postgres',
  'postgres.DATABASE_URL',
] as const

export type ErrorLabel = (typeof ERROR_LABELS)[number]

export type ErrorId = `${ErrorLabel}.${ErrorReasonName}`

export const ERROR_MESSAGES: { readonly [K in ErrorId]?: string } = {
  'course.acronym.taken': 'course.acronym ya existe en la organización',
  'course.contract_address.format':
    'course.contract_address debe ser 0x y 40 hex',
  'course.end_at.order': 'course.end_at debe ser posterior a course.start_at',
  'person_course.role_required':
    'solo un student o un teacher se matricula en un curso',
  'person.protected': 'el organization_admin no se puede borrar',
  'person.enrolled': 'un teacher con cursos no se puede borrar',
  'person_role.role.protected':
    'organization_admin solo lo tiene quien registra la organización',
  'person_role.role.format':
    'person_role.role debe ser organization_admin, teacher o student',
  'role.name.format':
    'role.name debe ser organization_admin, teacher o student',
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
