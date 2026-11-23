import {
  ConflictError,
  NotFoundError,
  PersistenceError,
} from '../errors'

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

export function domainErrorFromPg(error: object): Error | undefined {
  const code = pgField(error, 'code')
  const constraint = pgField(error, 'constraint') ?? ''

  if (code === '23505') {
    if (constraint.includes('email')) {
      return new ConflictError('person.email ya existe', {
        entity: 'person',
        field: 'email',
      })
    }
    if (constraint.includes('identification_document')) {
      return new ConflictError('person.identification_document ya existe', {
        entity: 'person',
        field: 'identification_document',
      })
    }
    if (constraint.includes('tax_id')) {
      return new ConflictError('organization.tax_id ya existe', {
        entity: 'organization',
        field: 'tax_id',
      })
    }
    if (constraint.includes('contract_address')) {
      return new ConflictError('course.contract_address ya existe', {
        entity: 'course',
        field: 'contract_address',
      })
    }
    if (constraint.includes('acronym')) {
      return new ConflictError(
        'course.acronym ya existe en la organización',
        { entity: 'course', field: 'acronym' },
      )
    }
    if (constraint === 'person_course_pkey') {
      return new ConflictError('person_course ya existe', {
        entity: 'person_course',
      })
    }
    if (constraint === 'person_role_pkey') {
      return new ConflictError('person_role ya existe', {
        entity: 'person_role',
      })
    }
  }

  if (code === '23503') {
    if (constraint === 'course_organization_id_fkey') {
      return new NotFoundError('organization no existe', {
        entity: 'organization',
      })
    }
    if (
      constraint === 'person_course_person_id_fkey' ||
      constraint === 'person_role_person_id_fkey'
    ) {
      return new NotFoundError('person no existe', { entity: 'person' })
    }
    if (constraint === 'person_course_course_id_fkey') {
      return new NotFoundError('course no existe', { entity: 'course' })
    }
  }

  return undefined
}

export function rethrowPg(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    const mapped = domainErrorFromPg(error)
    if (mapped) {
      throw mapped
    }
    throw error
  }

  throw new PersistenceError('error de PostgreSQL', {
    entity: 'postgres',
  })
}
