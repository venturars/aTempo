import { retrieveAllPersonRows } from '../postgres/executors/person'
import { personFromRow, type Person } from '../types/person'

export type RetrieveAllPersonsOutput = {
  persons: Person[]
}

export async function retrieveAllPersons(): Promise<RetrieveAllPersonsOutput> {
  const rows = await retrieveAllPersonRows()
  return { persons: rows.map((row) => personFromRow(row)) }
}
