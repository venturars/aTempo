export const rosterNames = [
  'Diego Molero',
  'Diego Torres',
  'Ella Deyavorsky',
  'Esther Patino',
  'Jimena Duran',
  'Jose Miguel',
  'Luis Duque',
  'Manuel Diaz',
  'Maria Osipuk',
  'Meghan Martin',
  'Miguel Rodriguez',
  'Raul Santamaria',
  'Sergio Cortes',
  'Sergio Moras',
  'Victor Chang'
]

// Hora a la que suele escanear cada persona. El margen de tarde es 09:10.
const usualArrival: Record<string, string> = {
  'Diego Molero': '09:04',
  'Diego Torres': '08:56',
  'Ella Deyavorsky': '08:51',
  'Esther Patino': '08:57',
  'Jimena Duran': '08:58',
  'Jose Miguel': '09:02',
  'Luis Duque': '09:05',
  'Manuel Diaz': '08:54',
  'Maria Osipuk': '09:01',
  'Meghan Martin': '09:06',
  'Miguel Rodriguez': '09:08',
  'Raul Santamaria': '08:48',
  'Sergio Cortes': '09:03',
  'Sergio Moras': '09:00',
  'Victor Chang': '09:07'
}

// Cada día llega un par de minutos antes o después. Sigue entrando antes de las 09:10.
function arrivalThatDay(name: string, day: string): string {
  const base = usualArrival[name] ?? '09:00'
  const [hour, minute] = base.split(':').map(Number)
  const swing = ((name.length * 3 + Number(day) * 7) % 5) - 2
  const total = Math.min(9 * 60 + 9, Math.max(8 * 60 + 45, hour * 60 + minute + swing))
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
}

export const todayEntry = rosterNames.map((name) => {
  if (name === 'Meghan Martin') {
    return '—'
  }
  if (name === 'Miguel Rodriguez') {
    return '09:18'
  }
  if (name === 'Victor Chang') {
    return '09:14'
  }
  return arrivalThatDay(name, '11')
})

export const todayLabel = 'Mié 11 nov 2026'

// La clase del Dashboard. Si cae en todayLabel, el título es Hoy. Si no, es la próxima.
export const dashboardDate = todayLabel

export function dashboardHeading(): string {
  return dashboardDate === todayLabel ? 'Hoy' : 'Próxima clase'
}

export const course = {
  name: 'AI Engineering',
  startsAt: '09:00',
  time: '09:00–18:00',
  room: 'Aula 3'
}

export type Attendance = 'presente' | 'retraso' | 'ausente' | 'pendiente'
export type SessionMarkBook = Record<string, Record<string, Attendance>>
export type JustKey = 'none' | 'pend' | 'ok' | 'no'
export type Phase = 'programada' | 'abierta' | 'cerrada'

export type RosterRow = {
  name: string
  time: string
  mark: Attendance
  just: JustKey
}

export type ClassSession = {
  id: string
  title: string
  dow: string
  time: string
  room: string
  state: 'Cerrada' | 'Cancelada'
  cancel: boolean
  rows: RosterRow[] | null
}

export type HistoryEntry = RosterRow & {
  title: string
  dow: string
  sessionTime: string
}

const dowNames: Record<string, string> = {
  Lun: 'Lunes',
  Mar: 'Martes',
  Mié: 'Miércoles',
  Jue: 'Jueves',
  Vie: 'Viernes'
}

const markRank: Record<Attendance | 'none', number> = {
  pendiente: 0,
  ausente: 1,
  retraso: 2,
  presente: 3,
  none: 3
}

function surnameOf(name: string): string {
  const parts = name.split(' ')
  return parts.length > 1 ? parts.slice(1).join(' ') : name
}

export function compareByName(a: string, b: string): number {
  return a.localeCompare(b, 'es')
}

export function compareStudents(
  a: { name: string; mark: Attendance | 'none' },
  b: { name: string; mark: Attendance | 'none' }
): number {
  const byMark = markRank[a.mark] - markRank[b.mark]
  if (byMark !== 0) {
    return byMark
  }
  const bySurname = surnameOf(a.name).localeCompare(surnameOf(b.name), 'es')
  if (bySurname !== 0) {
    return bySurname
  }
  return a.name.localeCompare(b.name, 'es')
}

function buildSession(
  id: string,
  late: Record<string, string>,
  absent: string[],
  just: Record<string, JustKey>
): ClassSession {
  const day = id.split(' ')[1] ?? ''
  const dow = dowNames[id.split(' ')[0] ?? ''] ?? ''
  const rows = rosterNames.map((name) => {
    const lateTime = late[name]
    const isAbsent = absent.includes(name)
    const mark: Attendance = isAbsent ? 'ausente' : lateTime !== undefined ? 'retraso' : 'presente'
    const time = isAbsent ? '—' : lateTime ?? arrivalThatDay(name, day)
    return {
      name,
      time,
      mark,
      just: isAbsent ? (just[name] ?? 'no') : 'none'
    }
  })
  const ordered = [...rows].sort(compareStudents)

  return {
    id,
    title: `Nov ${day} 2026`,
    dow,
    time: course.time,
    room: course.room,
    state: 'Cerrada',
    cancel: false,
    rows: ordered
  }
}

export const classSessions: ClassSession[] = [
  buildSession(
    'Mar 10 nov',
    { 'Diego Molero': '09:14', 'Miguel Rodriguez': '09:18', 'Victor Chang': '09:21' },
    ['Diego Torres'],
    { 'Diego Torres': 'pend' }
  ),
  buildSession(
    'Lun 9 nov',
    { 'Miguel Rodriguez': '09:16' },
    ['Meghan Martin', 'Esther Patino'],
    { 'Meghan Martin': 'ok', 'Esther Patino': 'no' }
  ),
  buildSession(
    'Vie 6 nov',
    { 'Miguel Rodriguez': '09:23', 'Victor Chang': '09:17' },
    ['Luis Duque'],
    { 'Luis Duque': 'no' }
  ),
  buildSession('Jue 5 nov', { 'Sergio Cortes': '09:19' }, ['Meghan Martin'], {
    'Meghan Martin': 'no'
  }),
  buildSession('Mié 4 nov', { 'Manuel Diaz': '09:15' }, [], {}),
  buildSession('Mar 3 nov', {}, [], {}),
  buildSession('Lun 2 nov', { 'Ella Deyavorsky': '09:13' }, [], {})
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
}

export function initialsOf(name: string): string {
  return initials(name)
}

export function sessionCounts(rows: RosterRow[]): { p: number; r: number; a: number } {
  return {
    p: rows.filter((row) => row.mark === 'presente').length,
    r: rows.filter((row) => row.mark === 'retraso').length,
    a: rows.filter((row) => row.mark === 'ausente').length
  }
}

export type RiskNotice = {
  tone: 'warning' | 'info'
  label: string
  header: string
  explanation: string
}

// Dos faltas en las últimas cuatro sesiones. Una sola falta no basta.
export function absenceRisk(name: string, book: SessionMarkBook = {}): RiskNotice | null {
  const recent = studentHistory(name, book).slice(0, 4)
  const missed = recent.filter((entry) => entry.mark === 'ausente')
  if (missed.length < 2) {
    return null
  }
  return {
    tone: 'warning',
    label: 'Puede faltar',
    header: 'Puede faltar hoy',
    explanation: `Ha faltado ${missed.length} veces en las últimas 4 clases.`
  }
}

// Dos llegadas tarde en las últimas cuatro sesiones. No es la misma pista que una falta.
export function lateRisk(name: string, book: SessionMarkBook = {}): RiskNotice | null {
  const recent = studentHistory(name, book).slice(0, 4)
  const late = recent.filter((entry) => entry.mark === 'retraso')
  if (late.length < 2) {
    return null
  }
  return {
    tone: 'info',
    label: 'Puede llegar tarde',
    header: 'Puede llegar tarde',
    explanation: `Ha llegado tarde ${late.length} veces en las últimas 4 clases.`
  }
}

export function studentRisk(name: string, book: SessionMarkBook = {}): RiskNotice | null {
  return absenceRisk(name, book) ?? lateRisk(name, book)
}

export function studentHistory(name: string, book: SessionMarkBook = {}): HistoryEntry[] {
  return classSessions.flatMap((session) => {
    if (session.rows === null) {
      return []
    }
    const row = session.rows.find((item) => item.name === name)
    if (row === undefined) {
      return []
    }
    return [
      {
        ...row,
        mark: book[session.id]?.[name] ?? row.mark,
        title: `${session.id} 2026`,
        dow: session.dow,
        sessionTime: session.time
      }
    ]
  })
}

export function studentSummary(
  name: string,
  book: SessionMarkBook = {}
): {
  pct: string
  late: number
  abs: number
} {
  const history = studentHistory(name, book)
  const late = history.filter((item) => item.mark === 'retraso').length
  const abs = history.filter((item) => item.mark === 'ausente').length
  const pct =
    history.length === 0 ? '—' : `${Math.round(((history.length - abs) / history.length) * 100)} %`

  return {
    pct,
    late,
    abs
  }
}

export type FollowUp = {
  name: string
  abs: number
  late: number
  pct: number
}

export type OpenExcuse = {
  name: string
  title: string
  just: 'pend' | 'no'
}

export function monthReport(): {
  sessions: number
  pct: number
  late: number
  absent: number
  follow: FollowUp[]
  excuses: OpenExcuse[]
} {
  const held = classSessions.filter((session) => session.rows !== null)
  const tally = new Map<string, FollowUp>()
  for (const name of rosterNames) {
    tally.set(name, { name, abs: 0, late: 0, pct: 100 })
  }
  let late = 0
  let absent = 0
  let present = 0
  const excuses: OpenExcuse[] = []
  for (const session of held) {
    for (const row of session.rows ?? []) {
      const person = tally.get(row.name)
      if (person === undefined) {
        continue
      }
      if (row.mark === 'retraso') {
        late += 1
        person.late += 1
      } else if (row.mark === 'ausente') {
        absent += 1
        person.abs += 1
      } else {
        present += 1
      }
      if (row.just === 'pend' || row.just === 'no') {
        excuses.push({ name: row.name, title: session.title, just: row.just })
      }
    }
  }
  const marks = present + late + absent
  const pct = marks === 0 ? 0 : Math.round(((present + late) / marks) * 100)
  for (const person of tally.values()) {
    person.pct =
      held.length === 0 ? 0 : Math.round(((held.length - person.abs) / held.length) * 100)
  }
  const follow = [...tally.values()]
    .filter((person) => person.abs > 0)
    .sort((a, b) => b.abs - a.abs || b.late - a.late || a.name.localeCompare(b.name, 'es'))

  return { sessions: held.length, pct, late, absent, follow, excuses }
}

export function lateCutoff(minutes: number): string {
  const [hourText, minuteText] = course.startsAt.split(':')
  const total = Number(hourText) * 60 + Number(minuteText) + minutes
  const hour = Math.floor(total / 60) % 24
  const minute = ((total % 60) + 60) % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function arrivalStatus(index: number, lateMinutes: number): 'presente' | 'retraso' {
  const entry = todayEntry[index]
  if (entry === undefined || entry === '—') {
    return 'presente'
  }
  return entry >= lateCutoff(lateMinutes) ? 'retraso' : 'presente'
}

export function rollStatus(
  phase: Phase,
  marks: Record<number, Attendance>,
  index: number,
  _lateMinutes: number
): Attendance | 'none' {
  if (phase === 'programada') {
    return 'none'
  }
  return marks[index] ?? 'pendiente'
}

export function rollTime(
  status: Attendance | 'none',
  index: number,
  times: Record<number, string> = {}
): string {
  const saved = times[index]
  if (saved !== undefined) {
    return saved
  }
  if (status === 'presente' || status === 'retraso') {
    return todayEntry[index] ?? '—'
  }
  return '—'
}
