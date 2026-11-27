import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

/** Dirección de contrato; columna PostgreSQL `course.contract_address`. */
export type ContractAddress = string & { readonly __contractAddress?: unique symbol }

const CONTRACT_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/

export function asContractAddress(value: string): ContractAddress {
  return value as ContractAddress
}

export function parseContractAddress(value: string): Result<ContractAddress> {
  const trimmed = value.trim()
  if (!CONTRACT_ADDRESS_PATTERN.test(trimmed)) {
    return err(
      new AppError(
        'VALIDATION',
        'La dirección del contrato debe ser 0x seguido de 40 dígitos hexadecimales.',
      ),
    )
  }
  return ok(asContractAddress(trimmed))
}