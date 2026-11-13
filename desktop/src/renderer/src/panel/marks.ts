import type { Attendance } from './roster'

export type MarkName = Attendance | 'cancelada' | 'sin-registro'

export const markLabel: Record<MarkName, string> = {
  presente: 'Presente',
  retraso: 'Tarde',
  ausente: 'Ausente',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  'sin-registro': 'Sin registro'
}

export const markBadge: Record<MarkName, string> = {
  presente: 'badge badge-sm badge-soft badge-success',
  retraso: 'badge badge-sm badge-soft badge-warning',
  ausente: 'badge badge-sm badge-soft badge-error',
  pendiente: 'badge badge-sm badge-soft badge-neutral',
  cancelada: 'badge badge-sm badge-soft',
  'sin-registro': 'badge badge-sm badge-soft'
}
