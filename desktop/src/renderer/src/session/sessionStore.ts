import { create } from 'zustand'

export type Profile = 'student' | 'teacher' | 'organization'

export type DashboardPath = '/student/dashboard' | '/teacher/panel' | '/organization/dashboard'

type SessionState = {
  profile: Profile | null
  email: string | null
  // Nombre que se enseña en el panel y que firma las correcciones. Solo lo tiene el profesor.
  name: string | null
  startSession: (profile: Profile, email: string) => void
  startStudentSession: (email: string) => void
  startTeacherSession: (email: string, name: string) => void
  // Salir desde la app: cierra la sesión y borra el token de Auth0 si lo hay.
  endSession: () => void
  // Remove the renderer profile when Auth0 authentication expires.
  clearSession: () => void
}

const dashboardPaths: Record<Profile, DashboardPath> = {
  student: '/student/dashboard',
  teacher: '/teacher/panel',
  organization: '/organization/dashboard'
}

export function dashboardPathForProfile(profile: Profile): DashboardPath {
  return dashboardPaths[profile]
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  email: null,
  name: null,
  startSession: (profile, email) => {
    set({ profile, email, name: null })
  },
  startStudentSession: (email) => {
    set({ profile: 'student', email, name: null })
  },
  startTeacherSession: (email, name) => {
    set({ profile: 'teacher', email, name })
  },
  endSession: () => {
    // En modo demo no hay token y el puente no hace nada; si falla, la sesión de la pantalla se cierra igual.
    void globalThis.window?.api?.auth.logout().catch(() => undefined)
    set({ profile: null, email: null, name: null })
  },
  clearSession: () => {
    set({ profile: null, email: null, name: null })
  }
}))
