import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import {
  ConflictError,
  PersistenceError,
  putJustification,
  ValidationError,
} from '../src'
import {
  DOCUMENT_ID,
  missingBucketError,
  missingKeyError,
  mockSend,
  resetDriver,
  validJustification,
} from './helpers'

afterEach(() => {
  resetDriver()
})

describe('putJustification', () => {
  it('lanza ValidationError si el UUID es inválido y no envía comandos S3', async () => {
    const calls = mockSend()

    await expect(
      putJustification({
        justification: { ...validJustification, document_id: 'no-es-uuid' },
      }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(calls).toEqual([])
  })

  it('lanza ValidationError si content_type está vacío y no envía PutObject', async () => {
    const calls = mockSend()

    await expect(
      putJustification({
        justification: { ...validJustification, content_type: '' },
      }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(calls).toEqual([])
  })

  it('guarda un justificante nuevo en justifications con clave UUID en minúsculas', async () => {
    const calls = mockSend(async (command) => {
      if (command instanceof HeadObjectCommand) {
        throw missingKeyError()
      }
      if (command instanceof PutObjectCommand) {
        return { ETag: '"etag-1"' }
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    const result = await putJustification({
      justification: {
        ...validJustification,
        document_id: DOCUMENT_ID.toUpperCase(),
      },
    })

    expect(result).toEqual({
      justification: {
        document_id: DOCUMENT_ID,
        content_type: 'application/pdf',
        body: validJustification.body,
        etag: '"etag-1"',
      },
    })
    expect(calls).toHaveLength(2)
    expect(calls[0]).toBeInstanceOf(HeadObjectCommand)
    expect(calls[0].input).toEqual({
      Bucket: 'justifications',
      Key: DOCUMENT_ID,
    })
    expect(calls[1]).toBeInstanceOf(PutObjectCommand)
    expect(calls[1].input).toEqual({
      Bucket: 'justifications',
      Key: DOCUMENT_ID,
      Body: validJustification.body,
      ContentType: 'application/pdf',
    })
  })

  it('lanza ConflictError si la clave existe y no envía PutObject', async () => {
    const calls = mockSend(async (command) => {
      if (command instanceof HeadObjectCommand) {
        return {}
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeInstanceOf(HeadObjectCommand)
    expect(
      calls.filter((command) => command instanceof PutObjectCommand),
    ).toEqual([])
  })

  it('lanza PersistenceError si S3 falla con un error que no es clave ausente', async () => {
    mockSend(async () => {
      throw new Error('timeout')
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })

  it('lanza PersistenceError si PutObject falla tras HeadObject de clave ausente', async () => {
    const calls = mockSend(async (command) => {
      if (command instanceof HeadObjectCommand) {
        throw missingKeyError()
      }
      if (command instanceof PutObjectCommand) {
        throw new Error('timeout')
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(PersistenceError)
    expect(calls).toHaveLength(2)
    expect(calls[1]).toBeInstanceOf(PutObjectCommand)
  })

  it('lanza PersistenceError si HeadObject responde NoSuchBucket y no envía PutObject', async () => {
    const calls = mockSend(async (command) => {
      if (command instanceof HeadObjectCommand) {
        throw missingBucketError()
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(PersistenceError)
    expect(calls).toHaveLength(1)
    expect(
      calls.filter((command) => command instanceof PutObjectCommand),
    ).toEqual([])
  })
})
