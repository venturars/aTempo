import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import {
  getJustification,
  justificationExists,
  PersistenceError,
  ValidationError,
} from '../src'
import {
  DOCUMENT_ID,
  missingBucketError,
  missingKeyError,
  missingObjectError,
  mockSend,
  resetDriver,
  validJustification,
} from './helpers'

afterEach(() => {
  resetDriver()
})

describe('getJustification', () => {
  it('lanza ValidationError si el UUID es inválido y no envía comandos S3', async () => {
    const calls = mockSend()

    await expect(getJustification({ id: 'no-es-uuid' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    expect(calls).toEqual([])
  })

  it('devuelve { justification: null } si la clave no existe', async () => {
    const calls = mockSend(async (command) => {
      if (command instanceof GetObjectCommand) {
        throw missingKeyError()
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    await expect(getJustification({ id: DOCUMENT_ID })).resolves.toEqual({
      justification: null,
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeInstanceOf(GetObjectCommand)
    expect(calls[0].input).toEqual({
      Bucket: 'justifications',
      Key: DOCUMENT_ID,
    })
  })

  it('devuelve el justificante con document_id, content_type, body y etag', async () => {
    mockSend(async (command) => {
      if (command instanceof GetObjectCommand) {
        expect(command.input.Key).toBe(DOCUMENT_ID)
        return {
          ContentType: validJustification.content_type,
          Body: validJustification.body,
          ETag: '"etag-1"',
        }
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    await expect(
      getJustification({ id: DOCUMENT_ID.toUpperCase() }),
    ).resolves.toEqual({
      justification: {
        document_id: DOCUMENT_ID,
        content_type: 'application/pdf',
        body: validJustification.body,
        etag: '"etag-1"',
      },
    })
  })

  it('devuelve { justification: null } si S3 responde NoSuchKey', async () => {
    mockSend(async (command) => {
      if (command instanceof GetObjectCommand) {
        throw missingObjectError()
      }
      throw new Error(`comando inesperado ${command.constructor.name}`)
    })

    await expect(getJustification({ id: DOCUMENT_ID })).resolves.toEqual({
      justification: null,
    })
  })

  it('lanza PersistenceError si S3 falla con un error que no es clave ausente', async () => {
    mockSend(async () => {
      throw new Error('ECONNREFUSED')
    })

    await expect(getJustification({ id: DOCUMENT_ID })).rejects.toBeInstanceOf(
      PersistenceError,
    )
  })

  it('lanza PersistenceError si el bucket no existe', async () => {
    mockSend(async () => {
      throw missingBucketError()
    })

    await expect(getJustification({ id: DOCUMENT_ID })).rejects.toBeInstanceOf(
      PersistenceError,
    )
  })
})

describe('justificationExists', () => {
  it('lanza ValidationError si el UUID es inválido y no envía comandos S3', async () => {
    const calls = mockSend()

    await expect(
      justificationExists({ id: 'no-es-uuid' }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(calls).toEqual([])
  })

  it('devuelve { exists: true } si la clave está y { exists: false } si no', async () => {
    const calls = mockSend(async (command) => {
      if (!(command instanceof HeadObjectCommand)) {
        throw new Error(`comando inesperado ${command.constructor.name}`)
      }
      if (command.input.Key === DOCUMENT_ID) {
        return {}
      }
      throw missingKeyError()
    })

    await expect(justificationExists({ id: DOCUMENT_ID })).resolves.toEqual({
      exists: true,
    })
    await expect(
      justificationExists({
        id: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
      }),
    ).resolves.toEqual({ exists: false })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toBeInstanceOf(HeadObjectCommand)
    expect(calls[0].input).toEqual({
      Bucket: 'justifications',
      Key: DOCUMENT_ID,
    })
    expect(calls[1].input.Bucket).toBe('justifications')
  })

  it('normaliza el UUID a minúsculas antes de consultar la clave', async () => {
    const calls = mockSend(async () => ({}))

    await expect(
      justificationExists({ id: DOCUMENT_ID.toUpperCase() }),
    ).resolves.toEqual({ exists: true })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeInstanceOf(HeadObjectCommand)
    expect(calls[0].input).toEqual({
      Bucket: 'justifications',
      Key: DOCUMENT_ID,
    })
  })

  it('lanza PersistenceError si S3 falla con un error que no es clave ausente', async () => {
    mockSend(async () => {
      throw new Error('ECONNREFUSED')
    })

    await expect(
      justificationExists({ id: DOCUMENT_ID }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })

  it('lanza PersistenceError si el bucket no existe', async () => {
    mockSend(async () => {
      throw missingBucketError()
    })

    await expect(
      justificationExists({ id: DOCUMENT_ID }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })
})
