import { NoSuchBucket, NoSuchKey, NotFound } from '@aws-sdk/client-s3'
import { DomainError, PersistenceError } from '../errors'

function stringField(error: object, field: string): string | undefined {
  if (!(field in error)) {
    return undefined
  }
  const value = (error as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}

function httpStatus(error: object): number | undefined {
  if (!('$metadata' in error)) {
    return undefined
  }
  const metadata = (error as { $metadata?: { httpStatusCode?: unknown } })
    .$metadata
  return typeof metadata?.httpStatusCode === 'number'
    ? metadata.httpStatusCode
    : undefined
}

function s3Name(error: object): string {
  return stringField(error, 'name') ?? ''
}

function s3Code(error: object): string {
  return stringField(error, 'Code') ?? stringField(error, 'code') ?? ''
}

function isMissingBucket(error: object): boolean {
  if (error instanceof NoSuchBucket) {
    return true
  }
  const name = s3Name(error)
  const code = s3Code(error)
  return name === 'NoSuchBucket' || code === 'NoSuchBucket'
}

function isMissingObject(error: object): boolean {
  if (error instanceof NoSuchKey || error instanceof NotFound) {
    return true
  }
  const name = s3Name(error)
  const code = s3Code(error)
  return (
    name === 'NotFound' ||
    name === 'NoSuchKey' ||
    code === 'NotFound' ||
    code === 'NoSuchKey'
  )
}

/**
 * Un HEAD de la clave dio 404. Un HEAD no lleva cuerpo: S3 responde el mismo
 * 404 NotFound si falta la clave o si falta el bucket. Un 404 sin nombre de S3
 * (un proxy, una ruta mal puesta) no dice que falte la clave.
 */
export function isMissingKeyOnHead(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  if (isMissingBucket(error)) {
    return false
  }
  return isMissingObject(error)
}

/**
 * Un GET de la clave dio 404. Un GET sí lleva cuerpo: S3 nombra NoSuchBucket
 * cuando falta el bucket. Cualquier otro 404 es una clave que no existe.
 */
export function isMissingKeyOnGet(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  if (isMissingBucket(error)) {
    return false
  }
  return isMissingObject(error) || httpStatus(error) === 404
}

/** HeadBucket dio 404: el bucket no existe. Un 403 no dice nada del bucket. */
export function isMissingBucketOnHead(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  return (
    isMissingBucket(error) ||
    isMissingObject(error) ||
    httpStatus(error) === 404
  )
}

/**
 * La escritura condicional (`IfNoneMatch: '*'`) no se hizo porque la clave ya
 * existe: 412 PreconditionFailed. Un 409 ConditionalRequestConflict no entra:
 * significa que otra escritura sobre la misma clave está en curso y puede
 * fallar, así que la clave quizá no llegue a existir. Ese caso sale como
 * PersistenceError y quien llama puede reintentar.
 */
export function isKeyTakenError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  return (
    httpStatus(error) === 412 ||
    s3Name(error) === 'PreconditionFailed' ||
    s3Code(error) === 'PreconditionFailed'
  )
}

export function rethrowS3(error: unknown): never {
  if (error instanceof DomainError) {
    throw error
  }

  throw new PersistenceError('error de RustFS', {
    entity: 'rustfs',
    cause: error instanceof Error ? error : undefined,
  })
}
