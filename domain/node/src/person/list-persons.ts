import { listPersons as listPersonRows } from '../postgres/repositories/person'
import { assertPerson, type Person } from '../types/person'

export type ListPersonsOutput = {
  persons: Person[]
}

export async function listPersons(): Promise<ListPersonsOutput> {
  const rows = await listPersonRows()
  return { persons: rows.map((row) => assertPerson(row)) }
}
