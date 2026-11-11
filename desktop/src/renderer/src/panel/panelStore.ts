import { create } from 'zustand'
import { rosterNames, type Attendance, type Phase } from './roster'

export type PanelTab = 0 | 1 | 2 | 3

type PanelState = {
  tab: PanelTab
  phase: Phase
  marks: Record<number, Attendance>
  classId: string | null
  studentName: string | null
  statsDateMode: 'range' | 'days'
  setStatsDateMode: (mode: 'range' | 'days') => void
  statsDates: string[] | null
  statsScroll: number
  setStatsDates: (dates: string[]) => void
  setStatsScroll: (scroll: number) => void
  confirmClose: boolean
  setTab: (tab: PanelTab) => void
  openSession: () => void
  askClose: () => void
  cancelClose: () => void
  closeSession: () => void
  reopenSession: () => void
  setMark: (index: number, mark: Attendance) => void
  openClass: (id: string) => void
  openStudent: (name: string) => void
  goBack: () => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
  tab: 0,
  phase: 'programada',
  marks: {},
  classId: null,
  studentName: null,
  statsDateMode: 'range',
  setStatsDateMode: (mode) => set({ statsDateMode: mode }),
  statsDates: null,
  statsScroll: 0,
  setStatsDates: (dates) => set({ statsDates: dates, statsScroll: 0 }),
  setStatsScroll: (scroll) => set({ statsScroll: scroll }),
  confirmClose: false,
  setTab: (tab) => {
    set({ tab, studentName: null, classId: null, confirmClose: false })
  },
  openSession: () => {
    set({ phase: 'abierta', marks: {}, confirmClose: false })
  },
  askClose: () => {
    set({ confirmClose: true })
  },
  cancelClose: () => {
    set({ confirmClose: false })
  },
  closeSession: () => {
    const marks = { ...get().marks }
    rosterNames.forEach((_, index) => {
      if (marks[index] === undefined) {
        marks[index] = 'ausente'
      }
    })
    set({ phase: 'cerrada', marks, confirmClose: false })
  },
  reopenSession: () => {
    set({ phase: 'abierta', confirmClose: false })
  },
  setMark: (index, mark) => {
    if (get().phase !== 'abierta') {
      return
    }
    set({ marks: { ...get().marks, [index]: mark } })
  },
  openClass: (id) => {
    set({ classId: id, studentName: null })
  },
  openStudent: (name) => {
    set({ studentName: name })
  },
  goBack: () => {
    if (get().studentName !== null) {
      set({ studentName: null })
      return
    }
    set({ classId: null })
  }
}))
