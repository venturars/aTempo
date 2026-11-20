import { getPersonById } from './get-person-by-id'

export async function assertPersonExists(id: string): Promise<void> {
  const person = await getPersonById(id)
  if (!person) {
    throw new Error('person no existe')
  }
}
