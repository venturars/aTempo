import { S3Client } from '@aws-sdk/client-s3'
import type {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { ConfigurationError } from '../errors'

export type RustfsS3Command =
  HeadBucketCommand | HeadObjectCommand | GetObjectCommand | PutObjectCommand

export type S3Send = (command: RustfsS3Command) => Promise<unknown>

type RustfsEnvKey =
  | 'RUSTFS_ENDPOINT'
  | 'RUSTFS_PORT'
  | 'RUSTFS_USE_SSL'
  | 'RUSTFS_ACCESS_KEY'
  | 'RUSTFS_SECRET_KEY'

let client: S3Client | undefined
let sendOverride: S3Send | undefined

function requiredEnv(name: RustfsEnvKey): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    throw new ConfigurationError(`Falta ${name}`, {
      entity: 'rustfs',
      field: name,
    })
  }
  return value
}

function endpointFromEnv(): string {
  const host = requiredEnv('RUSTFS_ENDPOINT')
  const port = requiredEnv('RUSTFS_PORT')
  const useSsl = requiredEnv('RUSTFS_USE_SSL')
  const scheme = useSsl === 'true' || useSsl === '1' ? 'https' : 'http'
  return `${scheme}://${host}:${port}`
}

function getClient(): S3Client {
  if (!client) {
    const endpoint = endpointFromEnv()
    const accessKeyId = requiredEnv('RUSTFS_ACCESS_KEY')
    const secretAccessKey = requiredEnv('RUSTFS_SECRET_KEY')
    client = new S3Client({
      endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  return client
}

export async function send<TOutput = unknown>(
  command: RustfsS3Command,
): Promise<TOutput> {
  if (sendOverride) {
    return (await sendOverride(command)) as TOutput
  }

  return (await getClient().send(command as never)) as TOutput
}

/** Sustituye el driver en los tests. RustFS no tiene que estar en marcha. */
export function substituteSend(fn: S3Send | undefined): void {
  sendOverride = fn
}

export function resetClient(): void {
  sendOverride = undefined
  const current = client
  client = undefined
  if (current) {
    current.destroy()
  }
}
