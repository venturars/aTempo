import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { teacherDemoAccount } from './teacherDemoAccount'
import { validateLogin } from './validateLogin'

// Mismo aviso para cualquier fallo: así no se sabe qué correos tienen cuenta.
const loginErrorText = 'El correo o la contraseña no coinciden con la cuenta de ejemplo.'

type LoginState = {
  email: string
  password: string
  emailError: string
  passwordError: string
  loginError: string
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  submit: () => boolean
}

export const useLoginStore = create<LoginState>((set, get) => ({
  email: '',
  password: '',
  emailError: '',
  passwordError: '',
  loginError: '',
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

    const normalizedEmail = normalizeEmail(email)

    if (normalizedEmail === teacherDemoAccount.email) {
      if (password !== teacherDemoAccount.password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
        return false
      }

      useSessionStore.setState({ profile: 'teacher', email: normalizedEmail })
      // La contraseña no se queda en memoria después de entrar.
      set({ password: '', emailError: '', passwordError: '', loginError: '' })
      return true
    }

    const account = useStudentAccountsStore.getState().findByEmail(email)

    if (account !== undefined) {
      if (account.password !== password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
        return false
      }

      set({ password: '', emailError: '', passwordError: '', loginError: '' })
      useSessionStore.getState().startStudentSession(account.email)
      return true
    }

    set({ emailError: '', passwordError: '', loginError: loginErrorText })
    return false
  }
}))
