import { justificationKeyExists } from '../rustfs/store/justification'
import { assertUuid, normalizeUuid } from '../shared/validation/assert'

export type JustificationExistsInput = {
  id: string
}

export type JustificationExistsOutput = {
  exists: boolean
}

export async function justificationExists(
  input: JustificationExistsInput,
): Promise<JustificationExistsOutput> {
  const id = normalizeUuid(assertUuid(input.id, 'justification.id'))
  return { exists: await justificationKeyExists(id) }
}
