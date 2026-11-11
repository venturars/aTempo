import { create } from 'zustand'
type Preferences = {
  lateMinutes: number
  arrival: boolean
  beforeStart: boolean
  beforeLate: boolean
  lateSummary: boolean
  beforeEnd: boolean
}
type SettingsState = Preferences & { update: (changes: Partial<Preferences>) => void }
// Local prototype preferences; notification timings are fixed, not user settings.
export const useSettingsStore = create<SettingsState>((set) => ({
  lateMinutes: 10,
  arrival: true,
  beforeStart: true,
  beforeLate: true,
  lateSummary: true,
  beforeEnd: true,
  update: (changes) => set(changes)
}))
