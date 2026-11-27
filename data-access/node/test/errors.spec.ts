import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ConflictError,
  PersistenceError,
  ValidationError,
} from '@atempo/errors'
import { buildError, fail } from '../src/shared/errors'
import { assertPersonCreate } from '../src/shared/validation/person'
import { assertRole } from '../src/shared/validation/role'
import { query } from '../src/postgres/pool'
import { mockDriver, resetDriver, validPerson } from './helpers'
import type { Role } from '../src/shared/types/role'

describe('catálogo de errores', () => {
  afterEach(() => {
    resetDriver()
  })

  it('builds id, kind, entity and field from label and reason', () => {
    const error = buildError('person.email', 'taken')
    expect(error).toBeInstanceOf(ConflictError)
    expect(error).toMatchObject({
      id: 'person.email.taken',
      kind: 'CONFLICT',
      entity: 'person',
      field: 'email',
      message: 'person.email ya existe',
    })
  })

  it('uses catalog overrides for special messages', () => {
    expect(buildError('course.acronym', 'taken').message).toBe(
      'course.acronym ya existe en la organización',
    )
    expect(buildError('course.contract_address', 'format').message).toBe(
      'course.contract_address debe ser 0x y 40 hex',
    )
    expect(buildError('person_role.student', 'exclusive').message).toBe(
      'un student no puede llevar otro rol',
    )
    expect(buildError('course.end_at', 'order').message).toBe(
      'course.end_at debe ser posterior a course.start_at',
    )
  })

  it('keeps the pg cause on an unmapped error', () => {
    const cause = new Error('connection refused')
    const error = buildError('postgres', 'unmapped', { cause })
    expect(error).toBeInstanceOf(PersistenceError)
    expect(error).toMatchObject({
      id: 'postgres.unmapped',
      kind: 'PERSISTENCE',
      entity: 'postgres',
      message: 'error de PostgreSQL',
    })
    expect(error.cause).toBe(cause)
  })

  it('throws with fail', () => {
    expect(() => fail('person', 'missing')).toThrow('person no existe')
    try {
      fail('person', 'missing')
    } catch (error) {
      expect(error).toMatchObject({ id: 'person.missing', kind: 'NOT_FOUND' })
    }
  })

  it('identifies a validation from assertPersonCreate', () => {
    try {
      assertPersonCreate({
        ...validPerson,
        first_name: '',
      })
      throw new Error('expected ValidationError')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect(error).toMatchObject({
        id: 'person.first_name.empty',
        kind: 'VALIDATION',
        entity: 'person',
        field: 'first_name',
      })
    }
  })

  it('identifies an invented role name', () => {
    try {
      assertRole({ name: 'admin' as Role['name'] })
      throw new Error('expected ValidationError')
    } catch (error) {
      expect(error).toMatchObject({
        id: 'role.name.format',
        kind: 'VALIDATION',
        entity: 'role',
        field: 'name',
      })
    }
  })

  it('maps a unique violation to the same id as the assert', async () => {
    mockDriver(async () => {
      throw Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'person_email_key',
      })
    })
    await expect(query('SELECT 1')).rejects.toMatchObject({
      id: 'person.email.taken',
      kind: 'CONFLICT',
    })
  })

  it('does not throw new in production source', () => {
    const src = join(__dirname, '../src')
    const files = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((name) => name.endsWith('.ts'))
      .map((name) => join(src, name))

    const offenders = files.filter((file) =>
      /throw new /.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
