import type { TextKey } from '../lang/messages'
import { text } from '../lang/useText'
import type { Attendance } from './roster'

export type MarkName = Attendance | 'cancelada' | 'sin-registro'

const markLabelKey: Record<MarkName, TextKey> = {
  presente: 'panel.marks.present',
  retraso: 'panel.marks.late',
  ausente: 'panel.marks.absent',
  pendiente: 'panel.marks.pending',
  cancelada: 'panel.marks.cancelled',
  'sin-registro': 'panel.marks.noRecord'
}

export function markLabel(mark: MarkName): string {
  return text(markLabelKey[mark])
}

export const markBadge: Record<MarkName, string> = {
  presente: 'badge badge-sm badge-soft badge-success',
  retraso: 'badge badge-sm badge-soft badge-warning',
  ausente: 'badge badge-sm badge-soft badge-error',
  pendiente: 'badge badge-sm badge-soft badge-neutral',
  cancelada: 'badge badge-sm badge-soft',
  'sin-registro': 'badge badge-sm badge-soft'
}
