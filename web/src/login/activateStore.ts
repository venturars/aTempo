import { useSessionStore } from '../session/sessionStore'
import { useStudentAccountsStore } from '../student/studentAccounts'
import { findInvitation, type Invitation } from './invitations'
import {
  hasErrors,
  normalizeDocument,
  validateActivation,
  type ActivationErrors,
  type ActivationForm
} from './validateActivation'

// Una invitación ya está activada si hay una cuenta con su correo.
export function isInvitationUsed(invitation: Invitation): boolean {
  return useStudentAccountsStore.getState().findByEmail(invitation.email) !== undefined
}

type ActivationResult = { entered: true } | { entered: false; errors: ActivationErrors }

// Crea la cuenta y abre la sesión, o devuelve los errores del formulario.
export function activateInvitation(code: string, form: ActivationForm): ActivationResult {
  const errors = validateActivation(form)
  const document = normalizeDocument(form.identificationDocument)
  const taken = useStudentAccountsStore
    .getState()
    .accounts.some((account) => account.identificationDocument === document)
  if (errors.identificationDocument === '' && taken) {
    errors.identificationDocument = 'Ya hay una cuenta con este documento.'
  }
  if (hasErrors(errors)) return { entered: false, errors }

  const invitation = findInvitation(code)
  if (invitation === undefined || isInvitationUsed(invitation)) return { entered: false, errors }
  useStudentAccountsStore.getState().addAccount({
    firstName: form.firstName,
    lastName: form.lastName,
    identificationDocument: document,
    email: invitation.email,
    password: form.password
  })
  useSessionStore.getState().startStudentSession(invitation.email)
  return { entered: true }
}
