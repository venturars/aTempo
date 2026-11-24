import { create } from 'zustand'
import { getApiClient, getDemoControls } from '../api/client'
import {
  ApiError,
  isConnectionError,
  type AttendanceCorrection,
  type AttendanceRecord,
  type CheckInCode,
  type ErrorCode,
  type Session
} from '../api/contract'
import { arrivalStatus, checkedInByStudent } from '../api/attendanceRules'
import { atSessionTime, clockTime, isClockTime, localDay } from '../api/isoTime'
import { correctedStatusOf, isEditablePhase, markOf, phaseOf } from './apiValues'
import type { Attendance, Phase, SessionMarkBook } from './roster'

export type PanelTab = 0 | 1 | 2 | 3
export type TodayLoad = 'loading' | 'ready' | 'empty' | 'denied' | 'failed' | 'signedOut'

export type TodayStudent = {
  studentId: string
  name: string
}

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
  scanned: Record<string, true>
  scannedFor: string | null
  checkInCode: CheckInCode | null
  busy: boolean
  todayError: string | null
  canSimulateArrival: boolean
  pendingCorrection: PendingCorrection | null
  correctionError: string | null
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
  resetToday: () => void
  openSession: () => Promise<void>
  askClose: () => void
  cancelClose: () => void
  closeSession: () => Promise<void>
  reopenSession: () => Promise<void>
  refreshCheckInCode: () => Promise<boolean>
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

export function todayPhase(state: Pick<PanelState, 'session'>): Phase {
  return state.session === null ? 'programada' : phaseOf(state.session.state)
}

export function todayMark(
  state: Pick<PanelState, 'session' | 'records'>,
  studentId: string
): Attendance | 'none' {
  if (!isEditablePhase(todayPhase(state))) {
    return 'none'
  }
  const record = state.records[studentId]
  return record === undefined ? 'pendiente' : markOf(record.status)
}

export function todayArrival(state: Pick<PanelState, 'records'>, studentId: string): string {
  const checkedInAt = state.records[studentId]?.checkedInAt
  return checkedInAt === null || checkedInAt === undefined ? '—' : clockTime(checkedInAt)
}

const errorMessages: Partial<Record<ErrorCode, string>> = {
  NETWORK_ERROR: 'No se ha podido conectar con el servidor. Inténtalo de nuevo.',
  NETWORK_TIMEOUT: 'El servidor tarda demasiado en responder. Inténtalo de nuevo.',
  FORBIDDEN: 'No tienes acceso a esta clase.',
  SESSION_NOT_FOUND: 'Esta clase ya no existe.',
  COURSE_NOT_FOUND: 'Este curso ya no existe.',
  STUDENT_NOT_ENROLLED: 'Este alumno ya no está en la clase.',
  SESSION_NOT_SCHEDULED: 'La lista ya se abrió desde otro sitio. Ya ves cómo está ahora.',
  SESSION_NOT_TODAY: 'Esta lista solo se puede abrir el día de la clase.',
  SESSION_NOT_OPEN: 'La lista ya no está abierta. Ya ves cómo está ahora.',
  SESSION_NOT_EDITABLE: 'Esta lista no se puede corregir ahora.',
  VALIDATION_FAILED: 'El cambio no es válido. Revisa la marca, la hora y el motivo.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento y vuelve a probar.'
}

const genericMessage = 'No se ha podido completar. Inténtalo de nuevo.'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return errorMessages[error.code] ?? genericMessage
  }
  return genericMessage
}

function hasCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof ApiError && error.code === code
}

function correctionErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.details.length > 0) {
    return error.details.map((detail) => detail.message).join(' ')
  }
  return errorMessage(error)
}

function keepsCorrection(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    !hasCode(error, 'REQUEST_CANCELLED') &&
    !hasCode(error, 'UNAUTHENTICATED') &&
    error.statusCode !== 404 &&
    error.statusCode !== 409
  )
}

function needsReread(error: unknown): boolean {
  return (
    (error instanceof ApiError && (error.statusCode === 409 || error.statusCode === 404)) ||
    (isConnectionError(error) && !hasCode(error, 'REQUEST_CANCELLED'))
  )
}

type CodeResult = {
  code: CheckInCode | null
  error: unknown
}

type Scans = Pick<PanelState, 'scanned' | 'scannedFor'>

function scansWith(state: Scans, sessionId: string, records: AttendanceRecord[]): Scans {
  const scanned = state.scannedFor === sessionId ? { ...state.scanned } : {}
  for (const record of records) {
    if (checkedInByStudent(record)) scanned[record.studentId] = true
  }
  return { scanned, scannedFor: sessionId }
}

function recordsById(records: AttendanceRecord[]): Record<string, AttendanceRecord> {
  return Object.fromEntries(records.map((record) => [record.studentId, record]))
}

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

  async function fetchCode(sessionId: string): Promise<CodeResult> {
    try {
      return { code: await getApiClient().getCheckInCode(sessionId), error: null }
    } catch (error) {
      return { code: null, error }
    }
  }

  function showCodeError(error: unknown): void {
    if (error === null || hasCode(error, 'REQUEST_CANCELLED')) {
      return
    }
    if (hasCode(error, 'UNAUTHENTICATED')) {
      set({ todayLoad: 'signedOut' })
      return
    }
    set({ todayError: errorMessage(error) })
  }

  async function showSession(session: Session): Promise<void> {
    const client = getApiClient()
    if (session.state === 'scheduled') {
      const students = await client.listCourseStudents(session.courseId)
      set({
        session,
        students: students.map(({ studentId, name }) => ({ studentId, name })),
        records: {},
        scanned: {},
        scannedFor: session.id,
        checkInCode: null,
        todayLoad: 'ready'
      })
      updateDemo()
      return
    }
    const noCode: CodeResult = { code: null, error: null }
    const [records, codeResult] = await Promise.all([
      client.listAttendances(session.id),
      session.state === 'open' ? fetchCode(session.id) : Promise.resolve(noCode)
    ])
    set({
      session,
      students: records.map(({ studentId, name }) => ({ studentId, name })),
      records: recordsById(records),
      ...scansWith(get(), session.id, records),
      checkInCode: codeResult.code,
      todayLoad: 'ready'
    })
    showCodeError(codeResult.error)
    updateDemo()
  }

  async function reloadSession(sessionId: string): Promise<void> {
    const session = await getApiClient().getSession(sessionId)
    await showSession(session)
  }

  async function showFailure(error: unknown, sessionId: string): Promise<void> {
    if (hasCode(error, 'REQUEST_CANCELLED')) {
      return
    }
    if (hasCode(error, 'UNAUTHENTICATED')) {
      set({ todayLoad: 'signedOut' })
      return
    }
    set({ todayError: errorMessage(error) })
    if (needsReread(error)) {
      await reloadSession(sessionId).catch(() => undefined)
    }
  }

  async function loadToday(): Promise<void> {
    set({ todayError: null })
    try {
      const sessions = await getApiClient().listSessions(localDay())
      const session = sessions[0]
      if (session === undefined) {
        set({
          todayLoad: 'empty',
          session: null,
          students: [],
          records: {},
          scanned: {},
          scannedFor: null
        })
        return
      }
      await showSession(session)
    } catch (error) {
      if (hasCode(error, 'REQUEST_CANCELLED')) {
        return
      }
      if (hasCode(error, 'UNAUTHENTICATED')) {
        set({ todayLoad: 'signedOut' })
        return
      }
      set({
        todayLoad: hasCode(error, 'FORBIDDEN') ? 'denied' : 'failed',
        todayError: errorMessage(error)
      })
    }
  }

  return {
    tab: 0,
    todayLoad: 'loading',
    session: null,
    students: [],
    records: {},
    scanned: {},
    scannedFor: null,
    checkInCode: null,
    busy: false,
    todayError: null,
    canSimulateArrival: false,
    pendingCorrection: null,
    correctionError: null,
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
    resetToday: () => {
      set({
        todayLoad: 'loading',
        session: null,
        students: [],
        records: {},
        scanned: {},
        scannedFor: null,
        checkInCode: null,
        todayError: null,
        canSimulateArrival: false,
        pendingCorrection: null,
        correctionError: null
      })
    },
    openSession: async () => {
      const session = get().session
      if (session === null || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        await showSession(await getApiClient().openSession(session.id))
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
        await showSession(await getApiClient().closeSession(session.id))
      } catch (error) {
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
      }
    },
    reopenSession: async () => {
      const session = get().session
      const demo = getDemoControls()
      if (session === null || demo === null || get().busy) {
        return
      }
      set({ busy: true, todayError: null })
      try {
        await showSession(await demo.reopenSession(session.id))
      } catch (error) {
        await showFailure(error, session.id)
      } finally {
        set({ busy: false })
      }
    },
    refreshCheckInCode: async () => {
      const session = get().session
      if (session === null || session.state !== 'open' || get().busy) {
        return false
      }
      const result = await fetchCode(session.id)
      if (get().busy || get().session?.state !== 'open') {
        return true
      }
      if (result.code !== null) {
        set({ checkInCode: result.code })
      }
      showCodeError(result.error)
      return true
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
            ...scansWith(state, session.id, [record])
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
      if (state.busy || state.pendingCorrection !== null) {
        return
      }
      if (status === null || record === undefined || !isEditablePhase(todayPhase(state))) {
        return
      }
      if (record.status === status) {
        return
      }
      if (status === 'absent' && state.scanned[studentId] === true) {
        return
      }
      set({
        pendingCorrection: { studentId, name: record.name, correction: { status } },
        correctionError: null
      })
    },
    requestTime: (studentId, time) => {
      const { session, busy, pendingCorrection } = get()
      const record = get().records[studentId]
      if (busy || pendingCorrection !== null) {
        return
      }
      if (session === null || record === undefined || !isClockTime(time)) {
        return
      }
      if (!isEditablePhase(phaseOf(session.state))) {
        return
      }
      if (record.status !== 'present' && record.status !== 'late') {
        return
      }
      set({
        correctionError: null,
        pendingCorrection: {
          studentId,
          name: record.name,
          correction: {
            status: arrivalStatus(session, time),
            checkedInAt: atSessionTime(session.startsAt, time)
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
      set({ busy: true, todayError: null, correctionError: null })
      try {
        const record = await getApiClient().correctAttendance(session.id, pending.studentId, {
          ...pending.correction,
          reason: reason.trim()
        })
        set((state) => ({
          records: { ...state.records, [record.studentId]: record },
          ...scansWith(state, session.id, [record]),
          pendingCorrection: null
        }))
      } catch (error) {
        if (keepsCorrection(error)) {
          set({ correctionError: correctionErrorMessage(error) })
          if (needsReread(error)) {
            await reloadSession(session.id).catch(() => undefined)
          }
        } else {
          set({ pendingCorrection: null })
          await showFailure(error, session.id)
        }
      } finally {
        set({ busy: false })
        updateDemo()
      }
    },
    cancelCorrection: () => {
      if (get().busy) {
        return
      }
      set({ pendingCorrection: null, correctionError: null })
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
