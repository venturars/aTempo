import { storageKeys } from '../../storageKeys'
import { dateKeyFromOldLabel } from '../studentDate'
import { normalizeEmail } from '../studentExample'

const noticesKey = storageKeys.notices

export type NoticeKind = 'retraso' | 'ausencia'

export type StudentNotice = {
  email: string
  kind: NoticeKind
  date: string
  // «09:20» en un retraso. Vacío en una ausencia.
  arrival: string
  reason: string
  // Nombre del archivo del justificante. Vacío si no hay.
  attachmentName: string
}

function noticeDate(notice: Record<string, unknown>): string | null {
  if (typeof notice.date === 'string') return notice.date
  return typeof notice.day === 'string' ? dateKeyFromOldLabel(notice.day) : null
}

function readNotice(value: unknown): StudentNotice | null {
  if (typeof value !== 'object' || value === null) return null
  const notice = value as Record<string, unknown>
  const date = noticeDate(notice)
  if (
    date === null ||
    typeof notice.email !== 'string' ||
    (notice.kind !== 'retraso' && notice.kind !== 'ausencia') ||
    typeof notice.arrival !== 'string' ||
    typeof notice.reason !== 'string' ||
    typeof notice.attachmentName !== 'string'
  ) {
    return null
  }
  return {
    email: notice.email,
    kind: notice.kind,
    date,
    arrival: notice.arrival,
    reason: notice.reason,
    attachmentName: notice.attachmentName
  }
}

function readAllNotices(): StudentNotice[] {
  try {
    const stored = localStorage.getItem(noticesKey)
    const parsed = stored === null ? [] : (JSON.parse(stored) as unknown)
    return Array.isArray(parsed) ? parsed.map(readNotice).filter((notice) => notice !== null) : []
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
