import { create } from 'zustand'
import { validateLogin } from './validateLogin'

export type SubmittedLogin = {
  email: string
  password: string
}

type LoginState = {
  email: string
  password: string
  emailError: string
  passwordError: string
  submitted: SubmittedLogin | null
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  submit: () => boolean
}

export const useLoginStore = create<LoginState>((set, get) => ({
  email: '',
  password: '',
  emailError: '',
  passwordError: '',
  submitted: null,
  setEmail: (email) => {
    set({ email, submitted: null })
  },
  setPassword: (password) => {
    set({ password, submitted: null })
  },
  submit: () => {
    const { email, password } = get()
    const errors = validateLogin(email, password)

    if (errors.email !== '' || errors.password !== '') {
      set({
        emailError: errors.email,
        passwordError: errors.password,
        submitted: null
      })
      return false
    }

    set({
      emailError: '',
      passwordError: '',
      submitted: {
        email: email.trim(),
        password
      }
    })
    return true
  }
}))
