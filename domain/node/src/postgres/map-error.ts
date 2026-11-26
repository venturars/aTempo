import { DomainError } from '@atempo/errors'
import { domainError } from '../shared/errors'

/**
 * Cada clave foránea del esquema y la tabla padre a la que apunta. Un 23503
 * que llega aquí viene de un INSERT o UPDATE: falta el padre. El DELETE de un
 * padre con hijos lo traduce `runParentDelete` antes de llegar aquí.
 */
const FOREIGN_KEY_PARENTS: Record<
  string,
  'organization' | 'person' | 'course' | 'role' | undefined
> = {
  course_organization_id_fkey: 'organization',
  person_course_person_id_fkey: 'person',
  person_role_person_id_fkey: 'person',
  person_course_course_id_fkey: 'course',
  person_role_role_fkey: 'role',
}

function pgField(
  error: object,
  field: 'code' | 'constraint' | 'where',
): string | undefined {
  if (!(field in error)) {
    return undefined
  }
  const value = (error as Record<string, string | undefined>)[field]
  return typeof value === 'string' ? value : undefined
}

export function domainErrorFromPg(error: object): DomainError | undefined {
  const code = pgField(error, 'code')
  const constraint = pgField(error, 'constraint') ?? ''

  if (code === '23505') {
    if (constraint.includes('email')) {
      return domainError('person.email', 'taken')
    }
    if (constraint.includes('identification_document')) {
      return domainError('person.identification_document', 'taken')
    }
    if (constraint.includes('tax_id')) {
      return domainError('organization.tax_id', 'taken')
    }
    if (constraint.includes('contract_address')) {
      return domainError('course.contract_address', 'taken')
    }
    if (constraint.includes('acronym')) {
      return domainError('course.acronym', 'taken')
    }
    if (constraint === 'person_course_pkey') {
      return domainError('person_course', 'taken')
    }
    if (constraint === 'person_role_pkey') {
      return domainError('person_role', 'taken')
    }
  }

  if (code === '23503') {
    const parent = FOREIGN_KEY_PARENTS[constraint]
    if (parent) {
      return domainError(parent, 'missing')
    }
  }

  // El trigger lanza un RAISE EXCEPTION genérico (P0001). El campo `where`
  // nombra la función PL/pgSQL que lo lanzó.
  if (code === 'P0001') {
    const where = pgField(error, 'where') ?? ''
    if (where.includes('person_role_student_is_exclusive')) {
      return domainError('person_role.student', 'exclusive')
    }
  }

  return undefined
}

export function rethrowPg(error: unknown): never {
  if (error instanceof DomainError) {
    throw error
  }

  if (typeof error === 'object' && error !== null) {
    const mapped = domainErrorFromPg(error)
    if (mapped) {
      throw mapped
    }
    throw domainError('postgres', 'unmapped', {
      cause: error instanceof Error ? error : undefined,
    })
  }

  throw domainError('postgres', 'unmapped')
}
