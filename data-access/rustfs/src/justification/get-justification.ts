import { findJustificationById } from '../rustfs/store/justification'
import { assertUuid, normalizeUuid } from '../shared/validation/assert'
import type { Justification } from '../shared/types/justification'

export type GetJustificationInput = {
  id: string
}

export type GetJustificationOutput = {
  justification: Justification | null
}

export async function getJustification(
  input: GetJustificationInput,
): Promise<GetJustificationOutput> {
  const id = normalizeUuid(assertUuid(input.id, 'justification.id'))
  return { justification: await findJustificationById(id) }
}
