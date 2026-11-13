import { create } from 'zustand'

export type Profile = 'student' | 'teacher' | 'organization'

export type DashboardPath = '/student/dashboard' | '/teacher/panel' | '/organization/dashboard'

type SessionState = {
  profile: Profile | null
}

const dashboardPaths: Record<Profile, DashboardPath> = {
  student: '/student/dashboard',
  teacher: '/teacher/panel',
  organization: '/organization/dashboard'
}

export function dashboardPathForProfile(profile: Profile): DashboardPath {
  return dashboardPaths[profile]
}

export const useSessionStore = create<SessionState>(() => ({
  profile: null
}))
