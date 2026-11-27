import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { check, PersistenceError } from '../src'
import { mockSend, resetDriver } from './helpers'

afterEach(() => {
  resetDriver()
})

describe('check', () => {
  it('devuelve { ok: true } con HeadBucket del bucket justifications', async () => {
    const calls = mockSend(async () => ({}))

    await expect(check()).resolves.toEqual({ ok: true })

    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeInstanceOf(HeadBucketCommand)
    expect(calls[0].input).toEqual({ Bucket: 'justifications' })
  })

  it('funciona sin variables de entorno si el driver está sustituido', async () => {
    mockSend(async () => ({}))

    await expect(check()).resolves.toEqual({ ok: true })
  })

  it('lanza PersistenceError si HeadBucket falla', async () => {
    mockSend(async () => {
      throw new Error('ECONNREFUSED')
    })

    await expect(check()).rejects.toBeInstanceOf(PersistenceError)
  })
})
