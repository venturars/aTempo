import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { useTeacherAccountsStore } from './teacherAccounts'
import { validateLogin } from './validateLogin'

// Mismo aviso para cualquier fallo: así no se sabe qué correos tienen cuenta.
const loginErrorText = 'El correo o la contraseña no coinciden.'

// El formulario vacío: al arrancar, al entrar y al salir de la pantalla.
const emptyLoginForm = {
  email: '',
  password: '',
  emailError: '',
  passwordError: '',
  loginError: ''
}

type LoginState = {
  email: string
  password: string
  emailError: string
  passwordError: string
  loginError: string
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  submit: () => boolean
  reset: () => void
}

export const useLoginStore = create<LoginState>((set, get) => ({
  ...emptyLoginForm,
  setEmail: (email) => {
    set({ email, loginError: '' })
  },
  setPassword: (password) => {
    set({ password, loginError: '' })
  },
  submit: () => {
    const { email, password } = get()
    const errors = validateLogin(email, password)

    if (errors.email !== '' || errors.password !== '') {
      set({
        emailError: errors.email,
        passwordError: errors.password,
        loginError: ''
      })
      return false
    }

    const teacher = useTeacherAccountsStore.getState().findByEmail(email)

    if (teacher !== undefined) {
      if (password !== teacher.password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
        return false
      }

      useSessionStore.getState().startTeacherSession(normalizeEmail(email), teacher.name)
      // El formulario se vacía al entrar. El correo sigue en la sesión.
      set(emptyLoginForm)
      return true
    }

    const account = useStudentAccountsStore.getState().findByEmail(email)

    if (account !== undefined) {
      if (account.password !== password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
        return false
      }

      set(emptyLoginForm)
      useSessionStore.getState().startStudentSession(account.email)
      return true
    }

    set({ emailError: '', passwordError: '', loginError: loginErrorText })
    return false
  },
  reset: () => {
    set(emptyLoginForm)
  }
}))
