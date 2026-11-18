import { create } from 'zustand'
import { storageKeys } from '../storageKeys'
import { normalizeEmail } from '../student/studentExample'

const themeKey = storageKeys.theme
const sessionKey = storageKeys.session

export type ThemeName = 'atempo-oscuro' | 'atempo-claro'

type SessionState = {
  email: string | null
  startStudentSession: (email: string) => void
  endStudentSession: () => void
}

function readEmail(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  const email = sessionStorage.getItem(sessionKey)
  return email === null || email === '' ? null : email
}

export function readTheme(): ThemeName {
  if (typeof sessionStorage === 'undefined') return 'atempo-oscuro'
  return sessionStorage.getItem(themeKey) === 'atempo-claro' ? 'atempo-claro' : 'atempo-oscuro'
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute('data-theme', theme)
  sessionStorage.setItem(themeKey, theme)
}

export function toggleTheme(): void {
  applyTheme(readTheme() === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro')
}

export const useSessionStore = create<SessionState>((set) => ({
  email: readEmail(),
  startStudentSession: (email) => {
    const normalized = normalizeEmail(email)
    sessionStorage.setItem(sessionKey, normalized)
    set({ email: normalized })
  },
  endStudentSession: () => {
    sessionStorage.removeItem(sessionKey)
    set({ email: null })
  }
}))
