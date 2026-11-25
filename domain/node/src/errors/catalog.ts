import type { DomainErrorCode } from './domain-error'

export const DOMAIN_ERROR_REASONS = {
  empty: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser un string no vacío`,
  },
  uuid: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser un uuid`,
  },
  date: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser una fecha`,
  },
  instant: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser una fecha con zona horaria`,
  },
  object: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser un objeto`,
  },
  nullable_string: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser string o null`,
  },
  format: {
    type: 'VALIDATION',
    message: (label: string) => `${label} tiene un formato inválido`,
  },
  order: {
    type: 'VALIDATION',
    message: (label: string) => `${label} debe ser posterior a course.start_at`,
  },
  taken: {
    type: 'CONFLICT',
    message: (label: string) => `${label} ya existe`,
  },
  exclusive: {
    type: 'CONFLICT',
    message: () => 'un student no puede llevar otro rol',
  },
  missing: {
    type: 'NOT_FOUND',
    message: (label: string) => `${label} no existe`,
  },
  not_created: {
    type: 'PERSISTENCE',
    message: (label: string) => `${label} no se ha creado`,
  },
  unmapped: {
    type: 'PERSISTENCE',
    message: () => 'error de PostgreSQL',
  },
  missing_env: {
    type: 'CONFIGURATION',
    message: (label: string) => `Falta ${label.slice(label.indexOf('.') + 1)}`,
  },
} as const satisfies Record<
  string,
  { type: DomainErrorCode; message: (label: string) => string }
>

export type DomainErrorReason = keyof typeof DOMAIN_ERROR_REASONS

export const DOMAIN_LABELS = [
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

export type DomainLabel = (typeof DOMAIN_LABELS)[number]

export type DomainErrorId = `${DomainLabel}.${DomainErrorReason}`

export const DOMAIN_ERROR_MESSAGES: { readonly [K in DomainErrorId]?: string } =
  {
    'course.acronym.taken': 'course.acronym ya existe en la organización',
    'course.contract_address.format':
      'course.contract_address debe ser 0x y 40 hex',
    'course.end_at.order': 'course.end_at debe ser posterior a course.start_at',
    'person_role.role.format':
      'person_role.role debe ser organization_admin, teacher o student',
    'role.name.format':
      'role.name debe ser organization_admin, teacher o student',
  }
