import { create } from 'zustand'
import type { TextKey } from '../language/messages'
import { useSessionStore } from '../session/sessionStore'
import { useStudentAccountsStore } from '../student/studentAccounts'
import { findInvitation, type Invitation } from './invitations'
import { useTeacherAccountsStore } from './teacherAccounts'
import { validateActivation } from './validateActivation'

const emptyActivateForm: { password: string; passwordError: TextKey | '' } = {
  password: '',
  passwordError: ''
}

type ActivateState = {
  password: string
  // La clave del error, o '' si no hay. El componente la traduce.
  passwordError: TextKey | ''
  setPassword: (password: string) => void
  submit: (code: string) => boolean
  reset: () => void
}

// Una invitación ya está activada si hay una cuenta con su correo.
export function isInvitationUsed(invitation: Invitation): boolean {
  return (
    useTeacherAccountsStore.getState().findByEmail(invitation.email) !== undefined ||
    useStudentAccountsStore.getState().findByEmail(invitation.email) !== undefined
  )
}

export const useActivateStore = create<ActivateState>((set, get) => ({
  ...emptyActivateForm,
  setPassword: (password) => {
    set({ password, passwordError: '' })
  },
  submit: (code) => {
    const { password } = get()
    const passwordError = validateActivation(password)
    if (passwordError !== '') {
      set({ passwordError })
      return false
    }

    const invitation = findInvitation(code)
    if (invitation === undefined || isInvitationUsed(invitation)) {
      return false
    }

    if (invitation.profile === 'teacher') {
      useTeacherAccountsStore.getState().addAccount(invitation.name, invitation.email, password)
      useSessionStore.getState().startTeacherSession(invitation.email, invitation.name)
    } else {
      useStudentAccountsStore.getState().addAccount(invitation.name, invitation.email, password)
      useSessionStore.getState().startStudentSession(invitation.email)
    }

    set(emptyActivateForm)
    return true
  },
  reset: () => {
    set(emptyActivateForm)
  }
}))
