import { create } from 'zustand'

export type Profile = 'student' | 'teacher' | 'organization'

export type DashboardPath = '/student/dashboard' | '/teacher/panel' | '/organization/dashboard'

type SessionState = {
  profile: Profile | null
  email: string | null
  // Nombre que se enseña en el panel y que firma las correcciones. Solo lo tiene el profesor.
  name: string | null
  startStudentSession: (email: string) => void
  startTeacherSession: (email: string, name: string) => void
  endSession: () => void
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
  startStudentSession: (email) => {
    set({ profile: 'student', email, name: null })
  },
  startTeacherSession: (email, name) => {
    set({ profile: 'teacher', email, name })
  },
  endSession: () => {
    set({ profile: null, email: null, name: null })
  }
}))
