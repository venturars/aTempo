import { insertJustification } from '../rustfs/store/justification'
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
  // Una sola petición: el PutObject lleva IfNoneMatch '*', así que RustFS no
  // sobrescribe una clave que ya existe (412 -> ConflictError) y avisa si falta
  // el bucket (NoSuchBucket -> PersistenceError). No hace falta mirar antes.
  return { justification: await insertJustification(justification) }
}
