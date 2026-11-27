import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ConflictError,
  PersistenceError,
  ValidationError,
  domainError,
  fail,
} from '../src/errors'
import {
  check,
  getJustification,
  justificationExists,
  putJustification,
} from '../src'
import { assertUuid } from '../src/types/assert'
import { endpointFromEnv } from '../src/rustfs/client'
import {
  DOCUMENT_ID,
  fillEnv,
  mockSend,
  resetDriver,
  validJustification,
} from './helpers'

afterEach(() => {
  resetDriver()
})

describe('catálogo de errores', () => {
  it('builds id, kind, entity and field from label and reason', () => {
    const error = domainError('justification.document_id', 'taken')
    expect(error).toBeInstanceOf(ConflictError)
    expect(error).toMatchObject({
      id: 'justification.document_id.taken',
      kind: 'CONFLICT',
      entity: 'justification',
      field: 'document_id',
      message: 'justification.document_id ya existe',
    })
  })

  it('uses catalog overrides for special messages', () => {
    expect(domainError('rustfs.bucket', 'missing_bucket').message).toBe(
      'el bucket justifications no existe',
    )
    expect(domainError('rustfs.RUSTFS_PORT', 'invalid_env').message).toBe(
      'RUSTFS_PORT tiene que ser un número de 1 a 65535',
    )
  })

  it('throws with fail and keeps the id', () => {
    expect(() => fail('justification.id', 'empty')).toThrow(
      'justification.id debe ser un string no vacío',
    )
    try {
      fail('justification.id', 'empty')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect(error).toMatchObject({
        id: 'justification.id.empty',
        kind: 'VALIDATION',
      })
    }
  })

  it('identifies an invalid uuid with the same id as the assert', () => {
    try {
      assertUuid('no-es-uuid', 'justification.document_id')
      throw new Error('expected ValidationError')
    } catch (error) {
      expect(error).toMatchObject({
        id: 'justification.document_id.uuid',
        kind: 'VALIDATION',
        entity: 'justification',
        field: 'document_id',
      })
    }
  })

  it('identifies a missing env var with id rustfs.RUSTFS_ENDPOINT.missing_env', async () => {
    fillEnv()
    delete process.env.RUSTFS_ENDPOINT

    await expect(check()).rejects.toMatchObject({
      id: 'rustfs.RUSTFS_ENDPOINT.missing_env',
      kind: 'CONFIGURATION',
      entity: 'rustfs',
      field: 'RUSTFS_ENDPOINT',
      message: 'Falta RUSTFS_ENDPOINT',
    })
  })

  it('identifies an invalid env value with id rustfs.RUSTFS_USE_SSL.invalid_env', () => {
    fillEnv()
    process.env.RUSTFS_USE_SSL = 'yes'

    try {
      endpointFromEnv()
      throw new Error('expected ConfigurationError')
    } catch (error) {
      expect(error).toMatchObject({
        id: 'rustfs.RUSTFS_USE_SSL.invalid_env',
        kind: 'CONFIGURATION',
        message: 'RUSTFS_USE_SSL tiene que ser true, false, 1 o 0',
      })
    }
  })

  it('maps an unknown S3 failure to rustfs.unmapped and keeps the cause', async () => {
    const cause = new Error('ECONNREFUSED')
    mockSend(async () => {
      throw cause
    })

    const error = await check().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(PersistenceError)
    expect(error).toMatchObject({
      id: 'rustfs.unmapped',
      kind: 'PERSISTENCE',
      message: 'error de RustFS',
    })
    expect((error as Error).cause).toBe(cause)
  })

  it('reports a missing bucket on HeadObject as rustfs.bucket.missing_bucket', async () => {
    const notFound = (name: string): Error =>
      Object.assign(new Error(name), {
        name,
        $metadata: { httpStatusCode: 404 },
      })
    mockSend(async (command) => {
      if (command.constructor.name === 'HeadObjectCommand') {
        throw notFound('NotFound')
      }
      throw notFound('NoSuchBucket')
    })

    const error = await justificationExists({ id: DOCUMENT_ID }).catch(
      (caught: unknown) => caught,
    )
    expect(error).toBeInstanceOf(PersistenceError)
    expect(error).toMatchObject({
      id: 'rustfs.bucket.missing_bucket',
      kind: 'PERSISTENCE',
    })
  })

  it('reports an unreadable body as justification.body.not_read', async () => {
    mockSend(async () => ({
      ContentType: 'application/pdf',
      ETag: '"abc"',
      Body: {},
    }))

    await expect(getJustification({ id: DOCUMENT_ID })).rejects.toMatchObject({
      id: 'justification.body.not_read',
      kind: 'PERSISTENCE',
      message: 'justification.body no se ha leído',
    })
  })

  it('reports a taken key as justification.document_id.taken without overwriting', async () => {
    mockSend(async () => {
      throw Object.assign(new Error('PreconditionFailed'), {
        name: 'PreconditionFailed',
        $metadata: { httpStatusCode: 412 },
      })
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toMatchObject({
      id: 'justification.document_id.taken',
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
