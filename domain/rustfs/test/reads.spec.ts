import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import {
  assertJustification,
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

  it('lee un objeto sin Content-Type como application/octet-stream', async () => {
    // Un objeto subido al bucket por otra herramienta, sin Content-Type.
    mockSend(async () => ({ Body: validJustification.body, ETag: '"etag-1"' }))

    const { justification } = await getJustification({ id: DOCUMENT_ID })
    expect(justification?.content_type).toBe('application/octet-stream')
    // Lo leído cumple las reglas del propio paquete.
    expect(() => assertJustification(justification!)).not.toThrow()
  })

  it('devuelve { justification: null } ante un 404 sin nombre en GetObject', async () => {
    // Un GET lleva cuerpo: si faltara el bucket, S3 diría NoSuchBucket.
    mockSend(async () => {
      throw Object.assign(new Error('Not Found'), {
        $metadata: { httpStatusCode: 404 },
      })
    })

    await expect(getJustification({ id: DOCUMENT_ID })).resolves.toEqual({
      justification: null,
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
  it('devuelve { exists: false } si HeadBucket da 403 por credenciales que solo ven objetos', async () => {
    mockSend(async (command) => {
      if (command instanceof HeadObjectCommand) {
        throw missingKeyError()
      }
      throw Object.assign(new Error('AccessDenied'), {
        name: 'AccessDenied',
        $metadata: { httpStatusCode: 403 },
      })
    })

    await expect(justificationExists({ id: DOCUMENT_ID })).resolves.toEqual({
      exists: false,
    })
  })

  it('lanza PersistenceError si HeadObject responde NoSuchBucket, sin enviar HeadBucket', async () => {
    const calls = mockSend(async () => {
      throw missingBucketError()
    })

    await expect(
      justificationExists({ id: DOCUMENT_ID }),
    ).rejects.toBeInstanceOf(PersistenceError)
    expect(
      calls.filter((command) => command instanceof HeadBucketCommand),
    ).toEqual([])
  })

  it('lanza PersistenceError ante un 404 sin nombre de S3', async () => {
    mockSend(async () => {
      throw Object.assign(new Error('Not Found'), {
        $metadata: { httpStatusCode: 404 },
      })
    })

    await expect(
      justificationExists({ id: DOCUMENT_ID }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })

  it('lanza ValidationError si el UUID es inválido y no envía comandos S3', async () => {
    const calls = mockSend()

    await expect(
      justificationExists({ id: 'no-es-uuid' }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(calls).toEqual([])
  })

  it('devuelve { exists: true } si la clave está y { exists: false } si no', async () => {
    const calls = mockSend(async (command) => {
      if (command instanceof HeadBucketCommand) {
        return {}
      }
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

    // La clave que falta pide además HeadBucket para confirmar el bucket.
    expect(calls).toHaveLength(3)
    expect(calls[2]).toBeInstanceOf(HeadBucketCommand)
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
    // Forma real del SDK: HeadObject y HeadBucket dan 404 NotFound.
    mockSend(async () => {
      throw missingKeyError()
    })

    await expect(
      justificationExists({ id: DOCUMENT_ID }),
    ).rejects.toBeInstanceOf(PersistenceError)
  })
})
