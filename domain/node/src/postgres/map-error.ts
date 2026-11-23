import { DomainError, domainError } from '../errors'

function pgField(
  error: object,
  field: 'code' | 'constraint',
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
    if (constraint === 'course_organization_id_fkey') {
      return domainError('organization', 'missing')
    }
    if (
      constraint === 'person_course_person_id_fkey' ||
      constraint === 'person_role_person_id_fkey'
    ) {
      return domainError('person', 'missing')
    }
    if (constraint === 'person_course_course_id_fkey') {
      return domainError('course', 'missing')
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
