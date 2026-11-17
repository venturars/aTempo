import { create } from 'zustand'
import {
  course,
  todayEntry,
  rosterNames,
  type Attendance,
  type Phase,
  type SessionMarkBook
} from './roster'

import { useSettingsStore } from './settingsStore'
import { statusForArrival } from '../student/attendanceStatus'

function validArrival(time: string | undefined): time is string {
  return time !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

export function nextDemoArrival(
  marks: Record<number, Attendance>,
  times: Record<number, string>
): number {
  return rosterNames.findIndex(
    (_, index) =>
      (marks[index] === undefined || marks[index] === 'pendiente') &&
      times[index] === undefined &&
      validArrival(todayEntry[index])
  )
}

// Misma regla de retraso que el alumno: puntual hasta el inicio más el margen, incluido.
function markForArrival(time: string): Attendance {
  const status = statusForArrival(time, course.startsAt, useSettingsStore.getState().lateMinutes)
  return status === 'tarde' ? 'retraso' : 'presente'
}

export type PanelTab = 0 | 1 | 2 | 3

type PanelState = {
  tab: PanelTab
  phase: Phase
  openedAt: number | null
  demoArrivals: Record<number, true>
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
  simulateArrival: (index: number) => void
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
  openedAt: null,
  demoArrivals: {},
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
    set({
      phase: 'abierta',
      openedAt: Date.now(),
      marks: {},
      times: {},
      demoArrivals: {},
      confirmClose: false
    })
  },
  askClose: () => {
    set({ confirmClose: true })
  },
  cancelClose: () => {
    set({ confirmClose: false })
  },
  closeSession: () => {
    const marks = { ...get().marks }
    const times = { ...get().times }
    rosterNames.forEach((_, index) => {
      if (marks[index] === undefined || marks[index] === 'pendiente') {
        marks[index] = 'ausente'
      }
      // Un ausente no tiene hora de entrada.
      if (marks[index] === 'ausente') {
        delete times[index]
      }
    })
    set({ phase: 'cerrada', marks, times, confirmClose: false })
  },
  reopenSession: () => {
    set({ phase: 'abierta', openedAt: Date.now(), confirmClose: false })
  },
  simulateArrival: (index) => {
    const state = get()
    const time = todayEntry[index]
    if (
      state.phase !== 'abierta' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= rosterNames.length ||
      !validArrival(time) ||
      (state.marks[index] !== undefined && state.marks[index] !== 'pendiente') ||
      state.times[index] !== undefined ||
      state.demoArrivals[index]
    ) {
      return
    }
    set({
      marks: { ...state.marks, [index]: markForArrival(time) },
      times: { ...state.times, [index]: time },
      demoArrivals: { ...state.demoArrivals, [index]: true }
    })
  },
  setMark: (index, mark) => {
    if (
      get().phase !== 'abierta' ||
      (get().demoArrivals[index] && (mark === 'ausente' || mark === 'pendiente'))
    ) {
      return
    }
    const times = { ...get().times }
    if (mark === 'ausente') {
      delete times[index]
    }
    set({ marks: { ...get().marks, [index]: mark }, times })
  },
  setTime: (index, time) => {
    if (get().phase !== 'abierta') {
      return
    }
    const marks = { ...get().marks }
    // Un ausente no tiene hora de entrada.
    if (marks[index] === 'ausente') {
      return
    }
    const next = { ...get().times }
    if (validArrival(time)) {
      next[index] = time
    } else {
      delete next[index]
    }
    // Si ya había llegado, la hora que se ve decide si es puntual o tarde.
    // Al borrar la hora corregida, vuelve a contar la del registro.
    const shown = next[index] ?? todayEntry[index]
    if ((marks[index] === 'presente' || marks[index] === 'retraso') && validArrival(shown)) {
      marks[index] = markForArrival(shown)
    }
    set({ times: next, marks })
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
