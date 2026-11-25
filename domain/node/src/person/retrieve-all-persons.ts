import { retrieveAllPersons as retrieveAllPersonRows } from '../postgres/executors/person'
import { assertPerson, type Person } from '../types/person'

export type RetrieveAllPersonsOutput = {
  persons: Person[]
}

export async function retrieveAllPersons(): Promise<RetrieveAllPersonsOutput> {
  const rows = await retrieveAllPersonRows()
  return { persons: rows.map((row) => assertPerson(row)) }
}
