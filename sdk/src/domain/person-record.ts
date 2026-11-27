import type { Email } from './email'
import type { IdentificationDocument } from './identifier'
import type { InvitationStatus } from './invitation-status'
import type { DateOnly, Uuid } from './scalars'
import type { NonEmptyText, Phone } from './text'

/** Fila de la tabla `person` (sin `person_role`). */
export type PersonRecord = {
  readonly id: Uuid
  readonly organizationId: Uuid
  readonly identificationDocument: IdentificationDocument
  readonly email: Email
  readonly firstName: NonEmptyText
  readonly lastName: NonEmptyText
  readonly birthDate: DateOnly | null
  readonly phone: Phone | null
  readonly invitationStatus: InvitationStatus
}