import {
  ConfigurationError,
  ConflictError,
  DomainError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  createErrorFactory,
} from '../src'

const TEST_LABELS = ['thing', 'thing.code'] as const

const TEST_REASONS = {
  invalid: {
    kind: 'VALIDATION',
    message: (label: string) => `${label} no es válido`,
  },
  missing: {
    kind: 'NOT_FOUND',
    message: (label: string) => `${label} no existe`,
  },
  taken: {
    kind: 'CONFLICT',
    message: (label: string) => `${label} ya existe`,
  },
  unset: {
    kind: 'CONFIGURATION',
    message: (label: string) => `${label} no está configurado`,
  },
  unmapped: {
    kind: 'PERSISTENCE',
    message: (label: string) => `error de ${label}`,
  },
} as const

const plainFactory = createErrorFactory({
  labels: TEST_LABELS,
  reasons: TEST_REASONS,
})

const factoryWithMessages = createErrorFactory({
  labels: TEST_LABELS,
  reasons: TEST_REASONS,
  messages: { 'thing.code.taken': 'el código ya está en uso' },
})

describe('createErrorFactory', () => {
  it('builds id, kind, entity and field from the catalog', () => {
    const error = plainFactory.domainError('thing.code', 'taken')
    expect(error).toBeInstanceOf(ConflictError)
    expect(error).toMatchObject({
      id: 'thing.code.taken',
      kind: 'CONFLICT',
      entity: 'thing',
      field: 'code',
      message: 'thing.code ya existe',
    })
  })

  it('uses the catalog message override', () => {
    expect(factoryWithMessages.domainError('thing.code', 'taken').message).toBe(
      'el código ya está en uso',
    )
    expect(factoryWithMessages.domainError('thing', 'taken').message).toBe(
      'thing ya existe',
    )
  })

  it('fail throws and keeps the cause', () => {
    const cause = new Error('connection refused')
    let thrown: unknown
    try {
      plainFactory.fail('thing', 'unmapped', { cause })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(PersistenceError)
    expect(thrown).toMatchObject({
      id: 'thing.unmapped',
      kind: 'PERSISTENCE',
      entity: 'thing',
      message: 'error de thing',
    })
    expect((thrown as PersistenceError).cause).toBe(cause)
  })

  it('maps every kind to its class', () => {
    const classByReason = {
      invalid: ValidationError,
      missing: NotFoundError,
      taken: ConflictError,
      unset: ConfigurationError,
      unmapped: PersistenceError,
    } as const

    for (const [reason, ErrorClass] of Object.entries(classByReason)) {
      const error = plainFactory.domainError(
        'thing',
        reason as keyof typeof classByReason,
      )
      expect(error).toBeInstanceOf(ErrorClass)
      expect(error).toBeInstanceOf(DomainError)
      expect(error.name).toBe(ErrorClass.name)
    }
  })

  it('rejects labels and reasons outside the catalog at compile time', () => {
    // @ts-expect-error 'other' no es una label del catálogo
    expect(() => plainFactory.fail('other', 'taken')).toThrow(ConflictError)
    // @ts-expect-error 'gone' no es una reason del catálogo
    expect(() => plainFactory.domainError('thing', 'gone')).toThrow(TypeError)
  })
})
