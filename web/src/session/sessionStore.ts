import { create } from 'zustand'
import type { TextKey } from '../lang/messages'
import { storageKeys } from '../storageKeys'
import { normalizeEmail } from '../student/studentExample'
import { logoutWebSession } from '../auth/webSession'

const themeKey = storageKeys.theme
const legacySessionKey = storageKeys.session

if (typeof localStorage !== 'undefined') localStorage.removeItem(legacySessionKey)

export type ThemeName = 'atempo-oscuro' | 'atempo-claro'

type SessionState = {
  email: string | null
  profile: 'student' | 'admin' | null
  isLoading: boolean
  isReady: boolean
  isLoggingOut: boolean
  // La clave del texto del error, o '' si no hay. La pantalla lo traduce con t().
  logoutError: TextKey | ''
  setSession: (email: string, profile: 'student' | 'admin') => void
  setLoading: (isLoading: boolean) => void
  endStudentSession: () => Promise<boolean>
}

export function readTheme(): ThemeName {
  if (typeof localStorage === 'undefined') return 'atempo-oscuro'
  return localStorage.getItem(themeKey) === 'atempo-claro' ? 'atempo-claro' : 'atempo-oscuro'
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(themeKey, theme)
}

export function toggleTheme(): void {
  applyTheme(readTheme() === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro')
}

export const useSessionStore = create<SessionState>((set) => ({
  email: null,
  profile: null,
  isLoading: false,
  isReady: false,
  isLoggingOut: false,
  logoutError: '',
  setSession: (email, profile) =>
    set({
      email: normalizeEmail(email),
      profile,
      isLoading: false,
      isReady: true,
      logoutError: ''
    }),
  setLoading: (isLoading) => set({ isLoading, isReady: !isLoading }),
  endStudentSession: async () => {
    set({ isLoggingOut: true, logoutError: '' })
    try {
      await logoutWebSession()
      set({
        email: null,
        profile: null,
        isLoading: false,
        isReady: true,
        isLoggingOut: false,
        logoutError: ''
      })
      return true
    } catch {
      // Conserva la sesión visible si el router no confirma que borró la cookie.
      set({ isLoggingOut: false, logoutError: 'account.errors.logoutFailed' })
      return false
    }
  }
}))
