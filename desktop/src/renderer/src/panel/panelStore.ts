import { create } from 'zustand'
import { rosterNames, type Attendance, type Phase, type SessionMarkBook } from './roster'

export type PanelTab = 0 | 1 | 2 | 3

type PanelState = {
  tab: PanelTab
  phase: Phase
  marks: Record<number, Attendance>
  times: Record<number, string>
  sessionMarks: SessionMarkBook
  classId: string | null
  studentName: string | null
  confirmClose: boolean
  statsDateMode: 'range' | 'days'
  statsDates: string[] | null
  statsScroll: number
  setStatsDateMode: (mode: 'range' | 'days') => void
  setStatsDates: (dates: string[]) => void
  setStatsScroll: (scroll: number) => void
  setTab: (tab: PanelTab) => void
  openSession: () => void
  askClose: () => void
  cancelClose: () => void
  closeSession: () => void
  reopenSession: () => void
  setMark: (index: number, mark: Attendance) => void
  setTime: (index: number, time: string) => void
  setSessionMark: (sessionId: string, name: string, mark: Attendance) => void
  openClass: (id: string) => void
  openStudent: (name: string) => void
  goBack: () => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
  tab: 0,
  phase: 'programada',
  marks: {},
  times: {},
  sessionMarks: {},
  classId: null,
  studentName: null,
  confirmClose: false,
  statsDateMode: 'range',
  statsDates: null,
  statsScroll: 0,
  setStatsDateMode: (mode) => set({ statsDateMode: mode }),
  setStatsDates: (dates) => set({ statsDates: dates, statsScroll: 0 }),
  setStatsScroll: (scroll) => set({ statsScroll: scroll }),
  setTab: (tab) => {
    set({ tab, studentName: null, classId: null, confirmClose: false })
  },
  openSession: () => {
    set({ phase: 'abierta', marks: {}, times: {}, confirmClose: false })
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
  setTime: (index, time) => {
    if (get().phase !== 'abierta') {
      return
    }
    const next = { ...get().times }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      delete next[index]
    } else {
      next[index] = time
    }
    set({ times: next })
  },
  setSessionMark: (sessionId, name, mark) => {
    const book = get().sessionMarks
    set({
      sessionMarks: {
        ...book,
        [sessionId]: { ...book[sessionId], [name]: mark }
      }
    })
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
