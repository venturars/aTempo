import { create } from 'zustand'

export type Profile = 'student' | 'teacher' | 'organization'

export type DashboardPath = '/student/dashboard' | '/teacher/panel' | '/organization/dashboard'

type SessionState = {
  profile: Profile | null
  email: string | null
  startStudentSession: (email: string) => void
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
  startStudentSession: (email) => {
    set({ profile: 'student', email })
  }
}))
