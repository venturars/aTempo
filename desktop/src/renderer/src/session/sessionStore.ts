import { create } from 'zustand'

export type Profile = 'student' | 'teacher' | 'organization'

export type DashboardPath = '/student/dashboard' | '/teacher/panel' | '/organization/dashboard'

type SessionState = {
  profile: Profile | null
  email: string | null
  startSession: (profile: Profile, email: string) => void
  startStudentSession: (email: string) => void
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
  startSession: (profile, email) => {
    set({ profile, email })
  },
  startStudentSession: (email) => {
    set({ profile: 'student', email })
  },
  // Remove the renderer profile when Auth0 authentication expires.
  clearSession: () => {
    set({ profile: null, email: null })
  }
}))
