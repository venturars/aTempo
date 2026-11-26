import type { PersonRecord } from './person-record'
import type { PersonRole } from './person-role'

export type { InvitationStatus } from './invitation-status'
export type { PersonRecord } from './person-record'
export type { PersonRole, PersonRoleAssignment } from './person-role'

/**
 * Persona en el directorio: registro `person` + filas `person_role`.
 */
export type OrganizationPerson = PersonRecord & {
  roles: PersonRole[]
}

/** Alias usado por los casos de uso y el router HTTP. */
export type Person = OrganizationPerson