import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { teacherDemoAccount } from './teacherDemoAccount'
import { validateLogin } from './validateLogin'

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
        set({
          emailError: '',
          passwordError: '',
          loginError: 'El correo o la contraseña no coinciden con la cuenta de ejemplo.'
        })
        return false
      }

      useSessionStore.setState({ profile: 'teacher', email: normalizedEmail })
      set({ emailError: '', passwordError: '', loginError: '' })
      return true
    }

    const account = useStudentAccountsStore.getState().findByEmail(email)

    if (account !== undefined) {
      if (account.password !== password) {
        set({
          emailError: '',
          passwordError: 'La contraseña no es la de esta cuenta.',
          loginError: ''
        })
        return false
      }

      set({ emailError: '', passwordError: '', loginError: '' })
      useSessionStore.getState().startStudentSession(account.email)
      return true
    }

    set({
      emailError: '',
      passwordError: '',
      loginError: 'El correo o la contraseña no coinciden con la cuenta de ejemplo.'
    })
    return false
  }
}))
