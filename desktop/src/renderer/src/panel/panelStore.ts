import { create } from 'zustand'
import { getApiClient, getDemoControls } from '../api/client'
import {
  ApiError,
  type AttendanceCorrection,
  type AttendanceRecord,
  type CheckInCode,
  type Session
} from '../api/contract'
import { clockTime, dayOf, isoAt } from '../api/isoTime'
import { statusForArrival } from '../student/attendanceStatus'
import { correctedStatusOf, markOf, phaseOf } from './apiValues'
import { todayDate, type Attendance, type Phase, type SessionMarkBook } from './roster'

function validArrival(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

export type PanelTab = 0 | 1 | 2 | 3

// Qué enseña la pestaña Hoy: cargando, la clase, sin clases, sin acceso o un fallo al leer.
export type TodayLoad = 'loading' | 'ready' | 'empty' | 'denied' | 'failed'

export type TodayStudent = {
  studentId: string
  name: string
}

// Un cambio elegido que espera su motivo en el diálogo.
export type PendingCorrection = {
  studentId: string
  name: string
  correction: Omit<AttendanceCorrection, 'reason'>
}

type PanelState = {
  tab: PanelTab
  todayLoad: TodayLoad
  session: Session | null
  students: TodayStudent[]
  records: Record<string, AttendanceRecord>
  checkInCode: CheckInCode | null
  busy: boolean
  todayError: string | null
  canSimulateArrival: boolean
  demoArrivals: Record<string, true>
  pendingCorrection: PendingCorrection | null
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
  loadToday: () => Promise<void>
  openSession: () => Promise<void>
  askClose: () => void
  cancelClose: () => void
  closeSession: () => Promise<void>
  reopenSession: () => Promise<void>
  refreshCheckInCode: () => Promise<void>
  simulateArrival: () => Promise<void>
  requestMark: (studentId: string, mark: Attendance) => void
  requestTime: (studentId: string, time: string) => void
  saveCorrection: (reason: string) => Promise<void>
  cancelCorrection: () => void
  setSessionMark: (sessionId: string, name: string, mark: Attendance) => void
  openClass: (id: string) => void
  openStudent: (name: string) => void
  goBack: () => void
}

// La fase de la clase de hoy. Sin clase, la pantalla se comporta como programada.
export function todayPhase(state: Pick<PanelState, 'session'>): Phase {
  return state.session === null ? 'programada' : phaseOf(state.session.state)
}

// La marca de un alumno. Antes de abrir la lista no hay marca: 'none'.
export function todayMark(
  state: Pick<PanelState, 'session' | 'records'>,
  studentId: string
): Attendance | 'none' {
  if (todayPhase(state) === 'programada') {
    return 'none'
  }
  const record = state.records[studentId]
  return record === undefined ? 'pendiente' : markOf(record.status)
}

// La hora de entrada de un alumno, o una raya si no tiene.
export function todayArrival(state: Pick<PanelState, 'records'>, studentId: string): string {
  const checkedInAt = state.records[studentId]?.checkedInAt
  return checkedInAt === null || checkedInAt === undefined ? '—' : clockTime(checkedInAt)
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 0) {
      return 'No se ha podido conectar con el servidor. Inténtalo de nuevo.'
    }
    if (error.statusCode === 403) {
      return 'No tienes acceso a esta clase.'
    }
    if (error.statusCode === 409) {
      return 'La clase ha cambiado desde otro sitio. Ya ves cómo está ahora.'
    }
  }
  return 'No se ha podido guardar el cambio. Inténtalo de nuevo.'
}

function recordsById(records: AttendanceRecord[]): Record<string, AttendanceRecord> {
  return Object.fromEntries(records.map((record) => [record.studentId, record]))
}

// Con StrictMode, React monta la pestaña dos veces: la segunda carga espera a la primera.
let todayRequest: Promise<void> | null = null

export const usePanelStore = create<PanelState>((set, get) => {
  function updateDemo(): void {
    const session = get().session
    const demo = getDemoControls()
    set({
      canSimulateArrival:
        session !== null && session.state === 'open' && demo !== null
          ? demo.hasNextArrival(session.id)
          : false
    })
  }

  // Lee la sesión y su lista. Antes de abrir, la lista sale de los alumnos del curso.
  async function showSession(session: Session): Promise<void> {
    const client = getApiClient()
    if (session.state === 'scheduled') {
      const students = await client.listCourseStudents(session.courseId)
      set({
        session,
        students: students.map(({ studentId, name }) => ({ studentId, name })),
        records: {},
        checkInCode: null,
        todayLoad: 'ready'
      })
    } else {
      const records = await client.listAttendances(session.id)
      set({
        session,
        students: records.map(({ studentId, name }) => ({ studentId, name })),
        records: recordsById(records),
        todayLoad: 'ready'
      })
    }
    if (session.state === 'open') {
      await get().refreshCheckInCode()
    } else {
      set({ checkInCode: null })
    }
    updateDemo()
  }

  async function reloadSession(sessionId: string): Promise<void> {
    const session = await getApiClient().getSession(sessionId)
    await showSession(session)
  }

  // Enseña el error. Si la clase cambió desde otro sitio (409), la vuelve a leer.
  async function showFailure(error: unknown, sessionId: string): Promise<void> {
    set({ todayError: errorMessage(error) })
    if (error instanceof ApiError && error.statusCode === 409) {
      try {
        await reloadSession(sessionId)
      } catch {
        // Si no se puede leer, el aviso que ya se ve basta.
      }
    }
  }

  async function loadToday(): Promise<void> {
    set({ todayError: null })
    try {
      const sessions = await getApiClient().listSessions(todayDate)
      const session = sessions[0]
      if (session === undefined) {
        set({ todayLoad: 'empty', session: null, students: [], records: {} })
        return
      }
      await showSession(session)
    } catch (error) {
      const denied = error instanceof ApiError && error.statusCode === 403
      set({ todayLoad: denied ? 'denied' : 'failed', todayError: errorMessage(error) })
    }
  }

  return {
    tab: 0,
    todayLoad: 'loading',
    session: null,
    students: [],
    records: {},
    checkInCode: null,
    busy: false,
    todayError: null,
    canSimulateArrival: false,
    demoArrivals: {},
    pendingCorrection: null,
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
    loadToday: () => {
      todayRequest ??= loadToday().finally(() => {
        todayRequest = null
      })
      return todayRequest
    },
    openSession: async () => {
      const session = get().session
      if (session === null || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        await getApiClient().openSession(session.id)
        set({ demoArrivals: {} })
        await reloadSession(session.id)
      } catch (error) {
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
      }
    },
    askClose: () => {
      set({ confirmClose: true })
    },
    cancelClose: () => {
      set({ confirmClose: false })
    },
    closeSession: async () => {
      const session = get().session
      set({ confirmClose: false })
      if (session === null || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        await getApiClient().closeSession(session.id)
        await reloadSession(session.id)
      } catch (error) {
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
      }
    },
    // Solo en la demo: el contrato v1 todavía no permite volver a abrir.
    reopenSession: async () => {
      const session = get().session
      const demo = getDemoControls()
      if (session === null || demo === null || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        await demo.reopenSession(session.id)
        await reloadSession(session.id)
      } catch (error) {
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
      }
    },
    refreshCheckInCode: async () => {
      const session = get().session
      if (session === null || session.state !== 'open') {
        return
      }
      try {
        const code = await getApiClient().getCheckInCode(session.id)
        set({ checkInCode: code })
      } catch (error) {
        set({ todayError: errorMessage(error) })
      }
    },
    simulateArrival: async () => {
      const session = get().session
      const demo = getDemoControls()
      if (session === null || demo === null || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        const record = await demo.simulateNextArrival(session.id)
        if (record !== null) {
          set((state) => ({
            records: { ...state.records, [record.studentId]: record },
            demoArrivals: { ...state.demoArrivals, [record.studentId]: true }
          }))
        }
      } catch (error) {
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
        updateDemo()
      }
    },
    requestMark: (studentId, mark) => {
      const state = get()
      const status = correctedStatusOf(mark)
      const record = state.records[studentId]
      if (status === null || record === undefined || todayPhase(state) === 'programada') {
        return
      }
      // Elegir la marca que ya tiene no cambia nada.
      if (record.status === status) {
        return
      }
      // Quien registró su llegada no puede pasar a ausente.
      if (state.demoArrivals[studentId] && status === 'absent') {
        return
      }
      set({ pendingCorrection: { studentId, name: record.name, correction: { status } } })
    },
    requestTime: (studentId, time) => {
      const session = get().session
      const record = get().records[studentId]
      if (session === null || record === undefined || !validArrival(time)) {
        return
      }
      // Solo tiene hora quien ha llegado.
      if (record.status !== 'present' && record.status !== 'late') {
        return
      }
      // La hora nueva decide si es puntual o tarde, con la misma regla que la llegada.
      const arrival = statusForArrival(time, clockTime(session.startsAt), session.lateMinutes)
      set({
        pendingCorrection: {
          studentId,
          name: record.name,
          correction: {
            status: arrival === 'presente' ? 'present' : 'late',
            checkedInAt: isoAt(dayOf(session.startsAt), time)
          }
        }
      })
    },
    saveCorrection: async (reason) => {
      const pending = get().pendingCorrection
      const session = get().session
      if (pending === null || session === null || reason.trim() === '' || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        const record = await getApiClient().correctAttendance(session.id, pending.studentId, {
          ...pending.correction,
          reason: reason.trim()
        })
        set((state) => ({
          records: { ...state.records, [record.studentId]: record },
          pendingCorrection: null
        }))
      } catch (error) {
        set({ pendingCorrection: null })
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
        updateDemo()
      }
    },
    cancelCorrection: () => {
      set({ pendingCorrection: null })
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
  }
})
