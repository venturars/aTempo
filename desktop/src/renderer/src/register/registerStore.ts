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
  repeatPassword: string
  nameError: string
  emailError: string
  passwordError: string
  repeatPasswordError: string
  submitted: SubmittedRegister | null
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setRepeatPassword: (repeatPassword: string) => void
  submit: () => void
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  name: '',
  email: '',
  password: '',
  repeatPassword: '',
  nameError: '',
  emailError: '',
  passwordError: '',
  repeatPasswordError: '',
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
  setRepeatPassword: (repeatPassword) => {
    set({ repeatPassword, submitted: null })
  },
  submit: () => {
    const { name, email, password, repeatPassword } = get()
    const errors = validateRegister(name, email, password, repeatPassword)

    if (
      errors.name !== '' ||
      errors.email !== '' ||
      errors.password !== '' ||
      errors.repeatPassword !== ''
    ) {
      set({
        nameError: errors.name,
        emailError: errors.email,
        passwordError: errors.password,
        repeatPasswordError: errors.repeatPassword,
        submitted: null
      })
      return
    }

    set({
      nameError: '',
      emailError: '',
      passwordError: '',
      repeatPasswordError: '',
      submitted: {
        name: name.trim(),
        email: email.trim(),
        password
      }
    })
  }
}))
