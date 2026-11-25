import type { AttendanceStatus, CorrectedStatus, SessionState } from '../api/contract'
import type { Attendance, Phase } from './roster'

const markOfStatus: Record<AttendanceStatus, Attendance> = {
  pending: 'pendiente',
  present: 'presente',
  late: 'retraso',
  absent: 'ausente'
}

export function markOf(status: AttendanceStatus): Attendance {
  return markOfStatus[status]
}

const statusOfMark: Record<Attendance, CorrectedStatus | null> = {
  pendiente: null,
  presente: 'present',
  retraso: 'late',
  ausente: 'absent'
}

export function correctedStatusOf(mark: Attendance): CorrectedStatus | null {
  return statusOfMark[mark]
}

const phaseOfState: Record<SessionState, Phase> = {
  scheduled: 'programada',
  open: 'abierta',
  closed: 'cerrada',
  cancelled: 'cancelada'
}

export function phaseOf(state: SessionState): Phase {
  return phaseOfState[state]
}

export function isEditablePhase(phase: Phase): boolean {
  return phase === 'abierta' || phase === 'cerrada'
}
