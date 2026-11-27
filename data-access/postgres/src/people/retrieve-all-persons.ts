import { retrieveAllPersonRows } from '../postgres/executors/person'
import { personFromRow } from '../postgres/rows/person'
import type { Person } from '../shared/types/person'

export type RetrieveAllPersonsOutput = {
  persons: Person[]
}

export async function retrieveAllPersons(): Promise<RetrieveAllPersonsOutput> {
  const rows = await retrieveAllPersonRows()
  return { persons: rows.map((row) => personFromRow(row)) }
}
