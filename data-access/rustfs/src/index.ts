export {
  ConflictError,
  ConfigurationError,
  DomainError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  type DomainErrorKind,
} from '@atempo/errors'
export type { ErrorId, ErrorReasonName } from './shared/errors'

export {
  assertBytes,
  assertNonEmptyString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './types/assert'
export {
  assertJustification,
  assertJustificationCreate,
  type Justification,
  type JustificationCreate,
} from './types/justification'

export { check } from './rustfs/check'

export {
  putJustification,
  type PutJustificationInput,
  type PutJustificationOutput,
} from './justification/put-justification'
export {
  getJustification,
  type GetJustificationInput,
  type GetJustificationOutput,
} from './justification/get-justification'
export {
  justificationExists,
  type JustificationExistsInput,
  type JustificationExistsOutput,
} from './justification/justification-exists'
