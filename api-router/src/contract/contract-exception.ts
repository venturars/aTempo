import { HttpException, ValidationError } from '@nestjs/common'

export type FieldError = {
  field: string
  message: string
}

export type ContractErrorBody = {
  statusCode: number
  error: string
  code: string
  message: string
  details?: FieldError[]
}

export class ContractException extends HttpException {
  constructor(
    statusCode: number,
    error: string,
    code: string,
    message: string,
    details?: FieldError[],
  ) {
    const body: ContractErrorBody = { statusCode, error, code, message }
    if (details !== undefined) {
      body.details = details
    }
    super(body, statusCode)
  }
}

export function validationFailed(details: FieldError[]): ContractException {
  return new ContractException(
    400,
    'Bad Request',
    'VALIDATION_FAILED',
    'La petición no es válida.',
    details,
  )
}

export function notFound(code: string, message: string): ContractException {
  return new ContractException(404, 'Not Found', code, message)
}

export function conflict(code: string, message: string): ContractException {
  return new ContractException(409, 'Conflict', code, message)
}

export function internalError(): ContractException {
  return new ContractException(
    500,
    'Internal Server Error',
    'INTERNAL_ERROR',
    'Error inesperado.',
  )
}

export function fieldErrors(
  errors: ValidationError[],
  parent = '',
): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent === '' ? error.property : `${parent}.${error.property}`
    const messages = Object.values(error.constraints ?? {})
    const own = messages.length > 0 ? [{ field, message: messages[0] }] : []
    return [...own, ...fieldErrors(error.children ?? [], field)]
  })
}
