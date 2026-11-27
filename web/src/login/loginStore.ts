import { create } from 'zustand'
import { loginWebSession } from '../auth/webSession'
import type { TextKey } from '../lang/messages'
import { useSessionStore } from '../session/sessionStore'
import { validateLogin } from './validateLogin'

// Los errores guardan la clave del texto, o '' si no hay. La pantalla los traduce con t().
type LoginState = {
  email: string
  password: string
  emailError: TextKey | ''
  passwordError: TextKey | ''
  loginError: TextKey | ''
  isSubmitting: boolean
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  submitWithAuth: () => Promise<boolean>
}

export const useLoginStore = create<LoginState>((set, get) => ({
  email: '',
  password: '',
  emailError: '',
  passwordError: '',
  loginError: '',
  isSubmitting: false,
  setEmail: (email) => set({ email, loginError: '' }),
  setPassword: (password) => set({ password, loginError: '' }),
  submitWithAuth: async () => {
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

    set({ isSubmitting: true, loginError: '' })
    try {
      const session = await loginWebSession(email, password)
      useSessionStore.getState().setSession(session.email, session.profile)
      set({
        email: '',
        password: '',
        emailError: '',
        passwordError: '',
        loginError: '',
        isSubmitting: false
      })
      return true
    } catch {
      set({
        emailError: '',
        passwordError: '',
        loginError: 'login.errors.wrongCredentials',
        isSubmitting: false
      })
      return false
    }
  }
}))
