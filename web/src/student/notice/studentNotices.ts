import { storageKeys } from '../../storageKeys'
import { normalizeEmail } from '../studentExample'

const noticesKey = storageKeys.notices

export type NoticeKind = 'retraso' | 'ausencia'

export type StudentNotice = {
  email: string
  kind: NoticeKind
  // Ejemplo: «Mié 18 nov». Igual que la etiqueta del historial.
  day: string
  // «09:20» en un retraso. Vacío en una ausencia.
  arrival: string
  reason: string
  // Nombre del archivo del justificante. Vacío si no hay.
  attachmentName: string
}

function isNotice(value: unknown): value is StudentNotice {
  if (typeof value !== 'object' || value === null) return false
  const notice = value as Record<string, unknown>
  return (
    typeof notice.email === 'string' &&
    (notice.kind === 'retraso' || notice.kind === 'ausencia') &&
    typeof notice.day === 'string' &&
    typeof notice.arrival === 'string' &&
    typeof notice.reason === 'string' &&
    typeof notice.attachmentName === 'string'
  )
}

function readAllNotices(): StudentNotice[] {
  try {
    const stored = localStorage.getItem(noticesKey)
    const parsed = stored === null ? [] : (JSON.parse(stored) as unknown)
    return Array.isArray(parsed) ? parsed.filter(isNotice) : []
  } catch {
    return []
  }
}

export function saveNotice(notice: StudentNotice): void {
  const notices = [...readAllNotices(), { ...notice, email: normalizeEmail(notice.email) }]
  localStorage.setItem(noticesKey, JSON.stringify(notices))
}

// El aviso más reciente va primero.
export function readNoticesFor(email: string): StudentNotice[] {
  const wanted = normalizeEmail(email)
  return readAllNotices()
    .filter((notice) => notice.email === wanted)
    .reverse()
}
