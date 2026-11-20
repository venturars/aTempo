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

    // El mismo aviso para un correo sin cuenta y una contraseña equivocada:
    // así no se puede averiguar qué correos tienen cuenta.
    const account = useStudentAccountsStore.getState().findByEmail(email)
    if (account === undefined || account.password !== password) {
      set({
        emailError: '',
        passwordError: '',
        loginError: 'El correo o la contraseña no son correctos. Revísalos y prueba otra vez.'
      })
      return false
    }

    set({ emailError: '', passwordError: '', loginError: '' })
    useSessionStore.getState().startStudentSession(account.email)
    return true
  }
}))
