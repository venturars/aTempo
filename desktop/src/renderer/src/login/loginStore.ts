import { create } from 'zustand'
import type { TextKey } from '../lang/messages'
import { afterPendingLogout, useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { exampleStudent } from '../student/studentExample'
import { teacherDemoAccount } from './teacherDemoAccount'
import { useTeacherAccountsStore } from './teacherAccounts'
import { validateLogin } from './validateLogin'

// Mismo aviso para cualquier fallo: así no se sabe qué correos tienen cuenta.
// Los errores se guardan como clave del texto y el componente los traduce.
const loginErrorKey: TextKey = 'login.errors.noMatch'
const authLoginErrorKey: TextKey = 'login.errors.invalid'
// Los errores del proceso principal llegan como código, por ejemplo SECURE_STORAGE_UNAVAILABLE.
const secureStorageErrorKey: TextKey = 'login.errors.secureStorage'

type LoginForm = {
  email: string
  password: string
  emailError: TextKey | ''
  passwordError: TextKey | ''
  loginError: TextKey | ''
}

// El formulario vacío: al arrancar, al entrar y al salir de la pantalla.
const emptyLoginForm: LoginForm = {
  email: '',
  password: '',
  emailError: '',
  passwordError: '',
  loginError: ''
}

type LoginState = LoginForm & {
  isSubmitting: boolean
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  submit: () => boolean
  submitWithAuth: () => Promise<boolean>
  setSubmitting: (isSubmitting: boolean) => void
  showLoginError: () => void
  reset: () => void
}

export const useLoginStore = create<LoginState>((set, get) => ({
  ...emptyLoginForm,
  isSubmitting: false,
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

    // Sin Auth0: la cuenta de ejemplo y las invitaciones activadas durante este arranque.
    const teacher = useTeacherAccountsStore.getState().findByEmail(email)

    if (teacher !== undefined) {
      if (password !== teacher.password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorKey })
        return false
      }

      useSessionStore.getState().startTeacherSession(normalizeEmail(email), teacher.name)
      // El formulario se vacía al entrar. El correo sigue en la sesión.
      set(emptyLoginForm)
      return true
    }

    const account = useStudentAccountsStore.getState().findByEmail(email)

    if (account !== undefined) {
      if (account.password !== password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorKey })
        return false
      }

      set(emptyLoginForm)
      useSessionStore.getState().startStudentSession(account.email)
      return true
    }

    set({ emailError: '', passwordError: '', loginError: loginErrorKey })
    return false
  },
  submitWithAuth: async () => {
    const { email, password } = get()
    const errors = validateLogin(email, password)

    if (errors.email !== '' || errors.password !== '') {
      set({ emailError: errors.email, passwordError: errors.password, loginError: '' })
      return false
    }

    const normalizedEmail = normalizeEmail(email)
    const isTeacher = normalizedEmail === teacherDemoAccount.email
    if (!isTeacher && normalizedEmail !== exampleStudent.email) {
      set({ emailError: '', passwordError: '', loginError: authLoginErrorKey })
      return false
    }

    set({ isSubmitting: true, loginError: '' })
    try {
      await afterPendingLogout()
      await window.api.auth.login({ email: normalizedEmail, password })
      if (isTeacher) {
        useSessionStore.getState().startTeacherSession(normalizedEmail, teacherDemoAccount.name)
      } else {
        useSessionStore.getState().startStudentSession(normalizedEmail)
      }
      set({ ...emptyLoginForm, isSubmitting: false })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const loginError =
        message === 'SECURE_STORAGE_UNAVAILABLE' ? secureStorageErrorKey : authLoginErrorKey
      set({ emailError: '', passwordError: '', loginError, isSubmitting: false })
      return false
    }
  },
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  showLoginError: () => set({ emailError: '', passwordError: '', loginError: authLoginErrorKey }),
  reset: () => {
    set({ ...emptyLoginForm, isSubmitting: false })
  }
}))
