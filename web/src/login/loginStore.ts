import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { useStudentAccountsStore } from '../student/studentAccounts'
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
  setEmail: (email) => set({ email, loginError: '' }),
  setPassword: (password) => set({ password, loginError: '' }),
  submit: () => {
    const { email, password } = get()
    const errors = validateLogin(email, password)
    if (errors.email !== '' || errors.password !== '') {
      set({ emailError: errors.email, passwordError: errors.password, loginError: '' })
      return false
    }

    const account = useStudentAccountsStore.getState().findByEmail(email)
    if (account === undefined) {
      set({
        emailError: '',
        passwordError: '',
        loginError: 'No hay una cuenta de alumno con este correo.'
      })
      return false
    }
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
}))
