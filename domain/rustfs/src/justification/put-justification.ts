import { ConflictError } from '../errors'
import {
  insertJustification,
  justificationKeyExists,
} from '../rustfs/store/justification'
import {
  assertJustificationCreate,
  type Justification,
  type JustificationCreate,
} from '../types/justification'

export type PutJustificationInput = {
  justification: JustificationCreate
}

export type PutJustificationOutput = {
  justification: Justification
}

export async function putJustification(
  input: PutJustificationInput,
): Promise<PutJustificationOutput> {
  const justification = assertJustificationCreate(input.justification)
  const exists = await justificationKeyExists(justification.document_id)
  if (exists) {
    throw new ConflictError('justification.document_id ya existe', {
      entity: 'justification',
      field: 'document_id',
    })
  }

  return { justification: await insertJustification(justification) }
}
