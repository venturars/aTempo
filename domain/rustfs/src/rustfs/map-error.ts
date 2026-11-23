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

export function isMissingKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  if (isMissingBucket(error)) {
    return false
  }
  if (isMissingObject(error)) {
    return true
  }
  return httpStatus(error) === 404
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
