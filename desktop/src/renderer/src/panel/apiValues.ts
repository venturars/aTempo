import type { AttendanceStatus, CorrectedStatus, SessionState } from '../api/contract'
import type { Attendance, Phase } from './roster'

// El único sitio donde los valores del contrato, en inglés, pasan a los de la pantalla.

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

// La marca que el profesor puede poner. Pendiente solo lo pone el servidor: devuelve null.
export function correctedStatusOf(mark: Attendance): CorrectedStatus | null {
  return statusOfMark[mark]
}

// Una sesión cancelada todavía no llega a esta pantalla. Si llega, se muestra como cerrada.
const phaseOfState: Record<SessionState, Phase> = {
  scheduled: 'programada',
  open: 'abierta',
  closed: 'cerrada',
  cancelled: 'cerrada'
}

export function phaseOf(state: SessionState): Phase {
  return phaseOfState[state]
}
