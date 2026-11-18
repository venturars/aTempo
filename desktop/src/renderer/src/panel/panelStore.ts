import { create } from 'zustand'
import {
  classSessions,
  course,
  dashboardDate,
  rollTime,
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

// Un cambio de estado con la lista ya cerrada. Se guarda quién, cuándo y por qué
// (principles.md, sección 11: las correcciones conservan su historial de auditoría).
export type MarkChange = {
  session: string
  student: string
  from: Attendance
  to: Attendance
  reason: string
  by: string
  at: number
}

// Con la lista cerrada solo se corrige a Presente, Tarde o Ausente, y siempre con motivo.
function canCorrect(from: Attendance, to: Attendance, reason: string): boolean {
  return from !== to && to !== 'pendiente' && reason.trim() !== ''
}

type PanelState = {
  tab: PanelTab
  phase: Phase
  demoArrivals: Record<number, true>
  marks: Record<number, Attendance>
  times: Record<number, string>
  sessionMarks: SessionMarkBook
  changes: MarkChange[]
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
  correctTodayMark: (index: number, mark: Attendance, reason: string, by: string) => boolean
  correctSessionMark: (
    sessionId: string,
    name: string,
    mark: Attendance,
    reason: string,
    by: string
  ) => boolean
  openClass: (id: string) => void
  openStudent: (name: string) => void
  goBack: () => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
  tab: 0,
  phase: 'programada',
  demoArrivals: {},
  marks: {},
  times: {},
  sessionMarks: {},
  changes: [],
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
    set({ phase: 'abierta', confirmClose: false })
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
    const times = get().times
    const next = { ...times }
    if (validArrival(time)) {
      next[index] = time
    } else {
      delete next[index]
    }
    // Si ya había llegado y la hora que se ve cambia, esa hora decide si es puntual o tarde.
    // Si la hora que se ve no cambia (por ejemplo, al borrar una hora que no se había corregido),
    // se respeta la marca puesta a mano.
    const arrived = marks[index] === 'presente' || marks[index] === 'retraso'
    const shownBefore = rollTime(marks[index] ?? 'pendiente', index, times)
    const shownAfter = rollTime(marks[index] ?? 'pendiente', index, next)
    if (arrived && shownAfter !== shownBefore && validArrival(shownAfter)) {
      marks[index] = markForArrival(shownAfter)
    }
    set({ times: next, marks })
  },
  correctTodayMark: (index, mark, reason, by) => {
    const state = get()
    const from = state.marks[index]
    if (
      state.phase !== 'cerrada' ||
      from === undefined ||
      !canCorrect(from, mark, reason) ||
      // Una llegada aceptada por el lector no pasa a ausencia, igual que con la lista abierta.
      (state.demoArrivals[index] && mark === 'ausente')
    ) {
      return false
    }
    const times = { ...state.times }
    // Un ausente no tiene hora de entrada.
    if (mark === 'ausente') {
      delete times[index]
    }
    set({
      marks: { ...state.marks, [index]: mark },
      times,
      changes: [
        ...state.changes,
        {
          session: dashboardDate,
          student: rosterNames[index] ?? '',
          from,
          to: mark,
          reason: reason.trim(),
          by,
          at: Date.now()
        }
      ]
    })
    return true
  },
  correctSessionMark: (sessionId, name, mark, reason, by) => {
    const state = get()
    const row = classSessions
      .find((session) => session.id === sessionId && !session.cancel)
      ?.rows?.find((item) => item.name === name)
    const from = state.sessionMarks[sessionId]?.[name] ?? row?.mark
    if (row === undefined || from === undefined || !canCorrect(from, mark, reason)) {
      return false
    }
    set({
      sessionMarks: {
        ...state.sessionMarks,
        [sessionId]: { ...state.sessionMarks[sessionId], [name]: mark }
      },
      changes: [
        ...state.changes,
        {
          session: `${sessionId} 2026`,
          student: name,
          from,
          to: mark,
          reason: reason.trim(),
          by,
          at: Date.now()
        }
      ]
    })
    return true
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
