import { findJustificationById } from '../rustfs/store/justification'
import { assertUuid, normalizeUuid } from '../types/assert'
import type { Justification } from '../types/justification'

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
