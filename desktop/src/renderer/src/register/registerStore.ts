import { create } from 'zustand'
import { validateRegister } from './validateRegister'

export type SubmittedRegister = {
  name: string
  email: string
  password: string
}

type RegisterState = {
  name: string
  email: string
  password: string
  nameError: string
  emailError: string
  passwordError: string
  submitted: SubmittedRegister | null
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  submit: () => void
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  name: '',
  email: '',
  password: '',
  nameError: '',
  emailError: '',
  passwordError: '',
  submitted: null,
  setName: (name) => {
    set({ name, submitted: null })
  },
  setEmail: (email) => {
    set({ email, submitted: null })
  },
  setPassword: (password) => {
    set({ password, submitted: null })
  },
  submit: () => {
    const { name, email, password } = get()
    const errors = validateRegister(name, email, password)

    if (errors.name !== '' || errors.email !== '' || errors.password !== '') {
      set({
        nameError: errors.name,
        emailError: errors.email,
        passwordError: errors.password,
        submitted: null
      })
      return
    }

    set({
      nameError: '',
      emailError: '',
      passwordError: '',
      submitted: {
        name: name.trim(),
        email: email.trim(),
        password
      }
    })
  }
}))
