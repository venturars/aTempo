import { AppError, Result } from 'atempo-sdk'
import { conflict, ContractException, notFound } from './contract-exception'

export function mapAppError(error: AppError): ContractException {
  if (error.code === 'VALIDATION') {
    return new ContractException(
      400,
      'Bad Request',
      'VALIDATION',
      error.message,
    )
  }
  if (error.code === 'CONFLICT') {
    return conflict('CONFLICT', error.message)
  }
  if (error.code === 'NOT_FOUND') {
    return notFound('NOT_FOUND', error.message)
  }
  return new ContractException(
    503,
    'Service Unavailable',
    'POSTGRES_API_UNAVAILABLE',
    error.message,
  )
}

export function unwrapSdk<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value
  }
  throw mapAppError(result.error)
}
