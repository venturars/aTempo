import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { teacherDemoAccount } from '../login/teacherDemoAccount'
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
  repeatPasswordError: '',
  registerError: ''
}

const duplicateEmailText = 'Ya hay una cuenta con este correo.'
const registerErrorText =
  'No se ha podido crear la cuenta. Comprueba los datos e inténtalo de nuevo.'
const secureStorageErrorText = 'Este dispositivo no puede proteger la sesión de forma segura.'

type RegisterState = {
  name: string
  email: string
  password: string
  repeatPassword: string
  nameError: string
  emailError: string
  passwordError: string
  repeatPasswordError: string
  registerError: string
  isSubmitting: boolean
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setRepeatPassword: (repeatPassword: string) => void
  submit: () => boolean
  submitWithAuth: () => Promise<boolean>
  reset: () => void
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  ...emptyRegisterForm,
  isSubmitting: false,
  setName: (name) => {
    set({ name, registerError: '' })
  },
  setEmail: (email) => {
    set({ email, registerError: '' })
  },
  setPassword: (password) => {
    set({ password, registerError: '' })
  },
  setRepeatPassword: (repeatPassword) => {
    set({ repeatPassword, registerError: '' })
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
    // El formulario se vacía al crear la cuenta. La cuenta (con su contraseña) sigue en el store de cuentas.
    set(emptyRegisterForm)
    useSessionStore.getState().startStudentSession(account.email)
    return true
  },
  submitWithAuth: async () => {
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
        registerError: ''
      })
      return false
    }

    const normalizedEmail = normalizeEmail(email)
    set({ isSubmitting: true, registerError: '', emailError: '' })
    try {
      await window.api.auth.register({ email: normalizedEmail, password })
      useSessionStore.getState().startStudentSession(normalizedEmail)
      set({ ...emptyRegisterForm, isSubmitting: false })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'USER_EXISTS') {
        set({
          emailError: duplicateEmailText,
          registerError: '',
          isSubmitting: false
        })
        return false
      }
      const registerError =
        message === 'SECURE_STORAGE_UNAVAILABLE' ? secureStorageErrorText : registerErrorText
      set({ emailError: '', registerError, isSubmitting: false })
      return false
    }
  },
  reset: () => {
    set({ ...emptyRegisterForm, isSubmitting: false })
  }
}))
