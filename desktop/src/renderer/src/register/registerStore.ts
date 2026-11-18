import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { useStudentAccountsStore } from '../student/studentAccounts'
import { useTeacherAccountsStore } from '../login/teacherAccounts'
import { validateRegister } from './validateRegister'

// El formulario vacío: al arrancar, al crear la cuenta y al salir de la pantalla.
const emptyRegisterForm = {
  name: '',
  email: '',
  password: '',
  repeatPassword: '',
  nameError: '',
  emailError: '',
  passwordError: '',
  repeatPasswordError: ''
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
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setRepeatPassword: (repeatPassword: string) => void
  submit: () => boolean
  reset: () => void
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  ...emptyRegisterForm,
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
      useTeacherAccountsStore.getState().findByEmail(email) !== undefined ||
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
    // El formulario se vacía al crear la cuenta. La cuenta (con su contraseña) sigue en el store de cuentas.
    set(emptyRegisterForm)
    useSessionStore.getState().startStudentSession(account.email)
    return true
  },
  reset: () => {
    set(emptyRegisterForm)
  }
}))
