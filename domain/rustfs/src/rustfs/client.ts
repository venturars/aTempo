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

/**
 * Lee RUSTFS_USE_SSL. Acepta true/false y 1/0 sin distinguir mayúsculas. Otro
 * valor (`yes`, `on`, una errata) es un fallo de configuración: tomarlo como
 * false enviaría las peticiones firmadas sin cifrar sin avisar.
 */
function useSslFromEnv(): boolean {
  const value = requiredEnv('RUSTFS_USE_SSL').trim().toLowerCase()
  if (value === 'true' || value === '1') {
    return true
  }
  if (value === 'false' || value === '0') {
    return false
  }
  throw new ConfigurationError(
    'RUSTFS_USE_SSL tiene que ser true, false, 1 o 0',
    { entity: 'rustfs', field: 'RUSTFS_USE_SSL' },
  )
}

/**
 * Lee RUSTFS_ENDPOINT como host, igual que api-rustfs y docker-compose.yml
 * (`rustfs`, `127.0.0.1`). Los scripts de rustfs/ usan la misma variable como
 * URL completa: aquí ese valor es un error claro y no una URL rota.
 */
function hostFromEnv(): string {
  const host = requiredEnv('RUSTFS_ENDPOINT').trim()
  if (host.includes('://') || host.includes('/') || host.includes(':')) {
    throw new ConfigurationError(
      'RUSTFS_ENDPOINT tiene que ser solo el host, sin esquema ni puerto (por ejemplo rustfs o 127.0.0.1)',
      { entity: 'rustfs', field: 'RUSTFS_ENDPOINT' },
    )
  }
  return host
}

function portFromEnv(): number {
  const text = requiredEnv('RUSTFS_PORT').trim()
  const port = Number(text)
  if (!/^\d+$/.test(text) || port < 1 || port > 65535) {
    throw new ConfigurationError(
      'RUSTFS_PORT tiene que ser un número de 1 a 65535',
      { entity: 'rustfs', field: 'RUSTFS_PORT' },
    )
  }
  return port
}

export function endpointFromEnv(): string {
  const host = hostFromEnv()
  const port = portFromEnv()
  const scheme = useSslFromEnv() ? 'https' : 'http'
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
