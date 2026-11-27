import {
  resetClient,
  substituteSend,
  type RustfsS3Command,
  type S3Send,
} from '../src/rustfs/client'

export const DOCUMENT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

export const RUSTFS_ENV_KEYS = [
  'RUSTFS_ENDPOINT',
  'RUSTFS_PORT',
  'RUSTFS_USE_SSL',
  'RUSTFS_ACCESS_KEY',
  'RUSTFS_SECRET_KEY',
] as const

export const validJustification = {
  document_id: DOCUMENT_ID,
  content_type: 'application/pdf',
  body: new Uint8Array([1, 2, 3]),
}

export function fillEnv(): void {
  process.env.RUSTFS_ENDPOINT = '127.0.0.1'
  process.env.RUSTFS_PORT = '9000'
  process.env.RUSTFS_USE_SSL = 'false'
  process.env.RUSTFS_ACCESS_KEY = 'test-access'
  process.env.RUSTFS_SECRET_KEY = 'test-secret'
}

export function missingKeyError(): Error {
  const error = new Error('NotFound')
  error.name = 'NotFound'
  Object.assign(error, { $metadata: { httpStatusCode: 404 } })
  return error
}

export function missingObjectError(name = 'NoSuchKey'): Error {
  const error = new Error(name)
  error.name = name
  Object.assign(error, { $metadata: { httpStatusCode: 404 } })
  return error
}

export function missingBucketError(): Error {
  const error = new Error('NoSuchBucket')
  error.name = 'NoSuchBucket'
  Object.assign(error, { $metadata: { httpStatusCode: 404 } })
  return error
}

export function mockSend(impl?: S3Send): RustfsS3Command[] {
  const calls: RustfsS3Command[] = []
  const fallback: S3Send = async () => ({})
  const run = impl ?? fallback

  substituteSend(async (command) => {
    calls.push(command)
    return run(command)
  })

  return calls
}

export function resetDriver(): void {
  resetClient()
  delete process.env.RUSTFS_ENDPOINT
  delete process.env.RUSTFS_PORT
  delete process.env.RUSTFS_USE_SSL
  delete process.env.RUSTFS_ACCESS_KEY
  delete process.env.RUSTFS_SECRET_KEY
}
