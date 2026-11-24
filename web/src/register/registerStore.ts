import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { useStudentAccountsStore } from '../student/studentAccounts'
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
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setRepeatPassword: (repeatPassword) => set({ repeatPassword }),
  submit: () => {
    const { name, email, password, repeatPassword } = get()
    const errors = validateRegister(name, email, password, repeatPassword)
    if (
      errors.name !== '' ||
      errors.email !== '' ||
      errors.password !== '' ||
      errors.repeatPassword !== ''
    ) {
      set(errors)
      return false
    }
    if (useStudentAccountsStore.getState().findByEmail(email) !== undefined) {
      set({
        nameError: '',
        emailError: 'Ya hay una cuenta con este correo.',
        passwordError: '',
        repeatPasswordError: ''
      })
      return false
    }
    const account = useStudentAccountsStore.getState().addAccount(name, email, password)
    set({ nameError: '', emailError: '', passwordError: '', repeatPasswordError: '' })
    useSessionStore.getState().startStudentSession(account.email)
    return true
  }
}))
