import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
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

    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedEmail !== teacherDemoAccount.email || password !== teacherDemoAccount.password) {
      set({
        emailError: '',
        passwordError: '',
        loginError: 'El correo o la contraseña no coinciden con la cuenta de ejemplo.'
      })
      return false
    }

    useSessionStore.setState({ profile: 'teacher', email: normalizedEmail })
    set({
      emailError: '',
      passwordError: '',
      loginError: ''
    })
    return true
  }
}))
