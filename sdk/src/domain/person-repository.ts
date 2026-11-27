import type { Email } from './email'
import type { IdentificationDocument } from './identifier'
import type { Person } from './person'
import type { Uuid } from './scalars'

export type PersonRepository = {
  findByEmail(email: Email): Promise<Person | null>
  findById(personId: Uuid): Promise<Person | null>
  findByIdentificationDocument(
    document: IdentificationDocument,
  ): Promise<Person | null>
  listByOrganization(organizationId: Uuid): Promise<Person[]>
  save(person: Person): Promise<void>
  delete(personId: Uuid): Promise<void>
}