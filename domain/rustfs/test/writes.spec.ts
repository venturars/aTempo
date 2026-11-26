import { PutObjectCommand } from '@aws-sdk/client-s3'
import {
  ConflictError,
  PersistenceError,
  putJustification,
  ValidationError,
} from '../src'
import {
  DOCUMENT_ID,
  missingBucketError,
  mockSend,
  resetDriver,
  validJustification,
} from './helpers'

afterEach(() => {
  resetDriver()
})

function s3Error(name: string, httpStatusCode: number): Error {
  return Object.assign(new Error(name), {
    name,
    $metadata: { httpStatusCode },
  })
}

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

  it('guarda un justificante nuevo con un solo PutObject condicional y clave UUID en minúsculas', async () => {
    const calls = mockSend(async (command) => {
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
    // Sin HeadObject ni HeadBucket: unas credenciales que solo pueden escribir
    // objetos bastan para subir.
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeInstanceOf(PutObjectCommand)
    expect(calls[0].input).toEqual({
      Bucket: 'justifications',
      Key: DOCUMENT_ID,
      Body: validJustification.body,
      ContentType: 'application/pdf',
      IfNoneMatch: '*',
    })
  })

  it('lanza ConflictError si la clave ya existe (412) y no sobrescribe', async () => {
    mockSend(async () => {
      throw s3Error('PreconditionFailed', 412)
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toMatchObject({
      id: 'justification.document_id.taken',
      kind: 'CONFLICT',
      field: 'document_id',
    })
    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('lanza PersistenceError y no ConflictError si otra escritura está en curso (409)', async () => {
    // 409 ConditionalRequestConflict: la otra subida puede fallar, así que la
    // clave quizá no llegue a existir. Quien llama puede reintentar.
    mockSend(async () => {
      throw s3Error('ConditionalRequestConflict', 409)
    })

    const attempt = putJustification({ justification: validJustification })
    await expect(attempt).rejects.toBeInstanceOf(PersistenceError)
    await expect(attempt).rejects.not.toBeInstanceOf(ConflictError)
  })

  it('lanza PersistenceError si el bucket no existe', async () => {
    mockSend(async () => {
      throw missingBucketError()
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })

  it('lanza PersistenceError si PutObject falla', async () => {
    mockSend(async () => {
      throw new Error('timeout')
    })

    await expect(
      putJustification({ justification: validJustification }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })
})
