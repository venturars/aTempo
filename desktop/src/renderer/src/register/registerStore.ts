import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { teacherDemoAccount } from '../login/teacherDemoAccount'
import { validateRegister } from './validateRegister'

type RegisterState = {
  name: string
  email: string
  password: string
  repeatPassword: string
  nameError: string
  emailError: string
  passwordError: string
  repeatPasswordError: string
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setRepeatPassword: (repeatPassword: string) => void
  submit: () => boolean
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
  setName: (name) => {
    set({ name })
  },
  setEmail: (email) => {
    set({ email })
  },
  setPassword: (password) => {
    set({ password })
  },
  setRepeatPassword: (repeatPassword) => {
    set({ repeatPassword })
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
        repeatPasswordError: errors.repeatPassword
      })
      return false
    }

    const accounts = useStudentAccountsStore.getState()

    if (
      normalizeEmail(email) === teacherDemoAccount.email ||
      accounts.findByEmail(email) !== undefined
    ) {
      set({
        nameError: '',
        emailError: 'Ya hay una cuenta con este correo.',
        passwordError: '',
        repeatPasswordError: ''
      })
      return false
    }

    const account = accounts.addAccount(name, email, password)
    // El formulario se vacía al crear la cuenta: las contraseñas no se quedan en memoria.
    set({
      name: '',
      email: '',
      password: '',
      repeatPassword: '',
      nameError: '',
      emailError: '',
      passwordError: '',
      repeatPasswordError: ''
    })
    useSessionStore.getState().startStudentSession(account.email)
    return true
  }
}))
