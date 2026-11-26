import { create } from 'zustand'
import { afterPendingLogout, useSessionStore } from '../session/sessionStore'
import { normalizeEmail, useStudentAccountsStore } from '../student/studentAccounts'
import { exampleStudent } from '../student/studentExample'
import { adminDemoAccount } from './adminDemoAccount'
import { teacherDemoAccount } from './teacherDemoAccount'
import { useTeacherAccountsStore } from './teacherAccounts'
import { validateLogin } from './validateLogin'

// Mismo aviso para cualquier fallo: así no se sabe qué correos tienen cuenta.
const loginErrorText = 'El correo o la contraseña no coinciden.'
const authLoginErrorText = 'El correo o la contraseña no son válidos.'
const secureStorageErrorText = 'Este dispositivo no puede proteger la sesión de forma segura.'

// El formulario vacío: al arrancar, al entrar y al salir de la pantalla.
const emptyLoginForm = {
  email: '',
  password: '',
  emailError: '',
  passwordError: '',
  loginError: ''
}

type LoginState = {
  email: string
  password: string
  emailError: string
  passwordError: string
  loginError: string
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

    // Sin Auth0, la cuenta de demo del admin abre la administración compartida con la web (#265).
    if (normalizeEmail(email) === adminDemoAccount.email) {
      if (password !== adminDemoAccount.password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
        return false
      }
      useSessionStore.getState().startSession('admin', adminDemoAccount.email)
      set(emptyLoginForm)
      return true
    }

    // Sin Auth0: la cuenta de ejemplo y las invitaciones activadas durante este arranque.
    const teacher = useTeacherAccountsStore.getState().findByEmail(email)

    if (teacher !== undefined) {
      if (password !== teacher.password) {
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
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
        set({ emailError: '', passwordError: '', loginError: loginErrorText })
        return false
      }

      set(emptyLoginForm)
      useSessionStore.getState().startStudentSession(account.email)
      return true
    }

    set({ emailError: '', passwordError: '', loginError: loginErrorText })
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
      set({ emailError: '', passwordError: '', loginError: authLoginErrorText })
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
        message === 'SECURE_STORAGE_UNAVAILABLE' ? secureStorageErrorText : authLoginErrorText
      set({ emailError: '', passwordError: '', loginError, isSubmitting: false })
      return false
    }
  },
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  showLoginError: () => set({ emailError: '', passwordError: '', loginError: authLoginErrorText }),
  reset: () => {
    set({ ...emptyLoginForm, isSubmitting: false })
  }
}))
