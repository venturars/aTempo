import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { useStudentAccountsStore } from '../student/studentAccounts'
import { findInvitation } from './invitations'
import { useTeacherAccountsStore } from './teacherAccounts'
import { validateActivation } from './validateActivation'

// Mismo aviso para un correo o un código que no encajan: así no se sabe a quién se ha invitado.
const noInvitationText = 'El correo o el código no coinciden con ninguna invitación.'
const usedInvitationText = 'Esta invitación ya está activada. Entra con tu contraseña.'

const emptyActivateForm = {
  email: '',
  code: '',
  password: '',
  emailError: '',
  codeError: '',
  passwordError: '',
  activateError: ''
}

type ActivateState = {
  email: string
  code: string
  password: string
  emailError: string
  codeError: string
  passwordError: string
  activateError: string
  setEmail: (email: string) => void
  setCode: (code: string) => void
  setPassword: (password: string) => void
  submit: () => boolean
  reset: () => void
}

function hasAccount(email: string): boolean {
  return (
    useTeacherAccountsStore.getState().findByEmail(email) !== undefined ||
    useStudentAccountsStore.getState().findByEmail(email) !== undefined
  )
}

export const useActivateStore = create<ActivateState>((set, get) => ({
  ...emptyActivateForm,
  setEmail: (email) => {
    set({ email, activateError: '' })
  },
  setCode: (code) => {
    set({ code, activateError: '' })
  },
  setPassword: (password) => {
    set({ password, activateError: '' })
  },
  submit: () => {
    const { email, code, password } = get()
    const errors = validateActivation(email, code, password)

    if (errors.email !== '' || errors.code !== '' || errors.password !== '') {
      set({
        emailError: errors.email,
        codeError: errors.code,
        passwordError: errors.password,
        activateError: ''
      })
      return false
    }

    const invitation = findInvitation(email, code)

    if (invitation === undefined) {
      set({ emailError: '', codeError: '', passwordError: '', activateError: noInvitationText })
      return false
    }

    if (hasAccount(invitation.email)) {
      set({ emailError: '', codeError: '', passwordError: '', activateError: usedInvitationText })
      return false
    }

    if (invitation.profile === 'teacher') {
      useTeacherAccountsStore.getState().addAccount(invitation.name, invitation.email, password)
      useSessionStore.getState().startTeacherSession(invitation.email, invitation.name)
    } else {
      useStudentAccountsStore.getState().addAccount(invitation.name, invitation.email, password)
      useSessionStore.getState().startStudentSession(invitation.email)
    }

    // El formulario se vacía al entrar. El correo sigue en la sesión.
    set(emptyActivateForm)
    return true
  },
  reset: () => {
    set(emptyActivateForm)
  }
}))
