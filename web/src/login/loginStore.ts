import { create } from 'zustand'
import { loginWebSession } from '../auth/webSession'
import { useSessionStore } from '../session/sessionStore'
import { validateLogin } from './validateLogin'

type LoginState = {
  email: string
  password: string
  emailError: string
  passwordError: string
  loginError: string
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
      set({ emailError: errors.email, passwordError: errors.password, loginError: '' })
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
    } catch (error) {
      set({
        emailError: '',
        passwordError: '',
        loginError:
          error instanceof Error
            ? error.message
            : 'El correo o la contraseña no son correctos. Revísalos y prueba otra vez.',
        isSubmitting: false
      })
      return false
    }
  }
}))
