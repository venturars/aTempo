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
import type { TextKey } from '../language/messages'
import { text } from '../language/useText'
import { teacherDemoAccount } from '../login/teacherDemoAccount'
import { useSessionStore } from '../session/sessionStore'
import { correctedStatusOf, isEditablePhase, markOf, phaseOf } from './apiValues'
import { classSessions, type Attendance, type Phase, type SessionMarkBook } from './roster'

export type PanelTab = 0 | 1 | 2 | 3
export type TodayLoad = 'loading' | 'ready' | 'empty' | 'denied' | 'failed' | 'signedOut'

export type TodayStudent = {
  studentId: string
  name: string
}

// Un cambio de estado con motivo. Se guarda quién, cuándo y por qué
// (principles.md, sección 11: las correcciones conservan su historial de auditoría).
export type MarkChange = {
  // Id de la sesión: el de la API en Hoy, o el de roster.ts en Sesiones.
  sessionId: string
  student: string
  from: Attendance
  to: Attendance
  reason: string
  by: string
  at: number
}

// En Sesiones solo se corrige a Presente, Tarde o Ausente, y siempre con motivo.
function canCorrect(from: Attendance, to: Attendance, reason: string): boolean {
  return from !== to && to !== 'pendiente' && reason.trim() !== ''
}

function signerName(): string {
  return useSessionStore.getState().name ?? teacherDemoAccount.name
}

// El error de una corrección: la clave de su texto o, si la API explica qué campo falla,
// esa explicación tal cual.
export type CorrectionError = { key: TextKey } | { apiText: string }

// Se llama al pintar, desde un componente con useText().
export function correctionErrorText(error: CorrectionError): string {
  return 'key' in error ? text(error.key) : error.apiText
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
  checkInCode: CheckInCode | null
  busy: boolean
  todayError: TextKey | null
  canSimulateArrival: boolean
  pendingCorrection: PendingCorrection | null
  correctionError: CorrectionError | null
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

const errorMessages: Partial<Record<ErrorCode, TextKey>> = {
  NETWORK_ERROR: 'panel.errors.network',
  NETWORK_TIMEOUT: 'panel.errors.timeout',
  FORBIDDEN: 'panel.errors.forbidden',
  SESSION_NOT_FOUND: 'panel.errors.sessionNotFound',
  COURSE_NOT_FOUND: 'panel.errors.courseNotFound',
  STUDENT_NOT_ENROLLED: 'panel.errors.studentNotEnrolled',
  SESSION_NOT_SCHEDULED: 'panel.errors.sessionNotScheduled',
  SESSION_NOT_TODAY: 'panel.errors.sessionNotToday',
  SESSION_NOT_OPEN: 'panel.errors.sessionNotOpen',
  SESSION_NOT_EDITABLE: 'panel.errors.sessionNotEditable',
  VALIDATION_FAILED: 'panel.errors.validationFailed',
  TOO_MANY_REQUESTS: 'panel.errors.tooManyRequests'
}

const genericMessage: TextKey = 'panel.errors.generic'

function errorMessage(error: unknown): TextKey {
  if (error instanceof ApiError) {
    return errorMessages[error.code] ?? genericMessage
  }
  return genericMessage
}

function hasCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof ApiError && error.code === code
}

function correctionErrorMessage(error: unknown): CorrectionError {
  if (error instanceof ApiError && error.details.length > 0) {
    return { apiText: error.details.map((detail) => detail.message).join(' ') }
  }
  return { key: errorMessage(error) }
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
        set({ todayLoad: 'empty', session: null, students: [], records: {} })
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
    checkInCode: null,
    busy: false,
    todayError: null,
    canSimulateArrival: false,
    pendingCorrection: null,
    correctionError: null,
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
          set((state) => ({ records: { ...state.records, [record.studentId]: record } }))
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
      if (status === 'absent' && checkedInByStudent(record)) {
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
        const previous = get().records[pending.studentId]
        set((state) => ({
          records: { ...state.records, [record.studentId]: record },
          pendingCorrection: null,
          changes:
            previous === undefined || previous.status === record.status
              ? state.changes
              : [
                  ...state.changes,
                  {
                    sessionId: session.id,
                    student: record.name,
                    from: markOf(previous.status),
                    to: markOf(record.status),
                    reason: reason.trim(),
                    by: signerName(),
                    at: Date.now()
                  }
                ]
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
            sessionId,
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
  }
})
