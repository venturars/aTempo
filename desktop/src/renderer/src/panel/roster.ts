export const rosterNames = [
  'Lucía Fernández',
  'Diego Morales',
  'Mateo García',
  'Sofía López',
  'Daniel Ruiz',
  'Carla Martín',
  'Hugo Sánchez',
  'Valeria Torres',
  'Pablo Jiménez',
  'Marta Navarro',
  'Adrián Gil',
  'Elena Ortega',
  'Irene Castro',
  'Nicolás Vega'
]

export const todayEntry = [
  '09:32',
  '—',
  '09:41',
  '09:30',
  '—',
  '09:34',
  '09:49',
  '09:31',
  '—',
  '09:33',
  '09:36',
  '09:30',
  '09:38',
  '09:32'
]

export const todayLabel = 'Jueves, 12 de noviembre'

export const course = {
  name: 'AI Engineering',
  time: '09:30–14:00',
  room: 'Aula 3'
}

export type Attendance = 'presente' | 'retraso' | 'ausente' | 'pendiente'
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

const clock = ['09:28', '09:30', '09:31', '09:32', '09:33', '09:34']

function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
}

export function emailOf(name: string): string {
  const parts = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(' ')
  return `${parts[0]}.${parts[1]}@neoland.es`
}

export function initialsOf(name: string): string {
  return initials(name)
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
    const time = isAbsent
      ? '—'
      : lateTime !== undefined
        ? lateTime
        : clock[name.length % clock.length]
    return {
      name,
      time,
      mark,
      just: isAbsent ? (just[name] ?? 'no') : 'none'
    }
  })
  const ordered = [
    ...rows.filter((row) => row.mark !== 'presente'),
    ...rows.filter((row) => row.mark === 'presente')
  ]

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
    { 'Lucía Fernández': '09:50', 'Hugo Sánchez': '09:44' },
    ['Diego Morales'],
    { 'Diego Morales': 'pend' }
  ),
  buildSession('Lun 9 nov', {}, ['Sofía López'], { 'Sofía López': 'ok' }),
  buildSession('Vie 6 nov', { 'Mateo García': '09:42' }, ['Irene Castro', 'Pablo Jiménez'], {
    'Irene Castro': 'no',
    'Pablo Jiménez': 'no'
  }),
  buildSession('Jue 5 nov', { 'Nicolás Vega': '09:39' }, ['Pablo Jiménez', 'Hugo Sánchez'], {
    'Hugo Sánchez': 'ok'
  }),
  buildSession('Mié 4 nov', { 'Carla Martín': '09:36' }, [], {}),
  buildSession('Mar 3 nov', {}, [], {}),
  {
    id: 'Lun 2 nov',
    title: 'Nov 2 2026',
    dow: 'Lunes',
    time: course.time,
    room: course.room,
    state: 'Cancelada',
    cancel: true,
    rows: null
  }
]

export function sessionCounts(rows: RosterRow[]): { p: number; r: number; a: number } {
  return {
    p: rows.filter((row) => row.mark === 'presente').length,
    r: rows.filter((row) => row.mark === 'retraso').length,
    a: rows.filter((row) => row.mark === 'ausente').length
  }
}

export function studentHistory(name: string): HistoryEntry[] {
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
        title: session.title,
        dow: session.dow,
        sessionTime: session.time
      }
    ]
  })
}

export function studentSummary(name: string): {
  pct: string
  late: number
  abs: number
  streak: number
  email: string
  initials: string
} {
  const history = studentHistory(name)
  const late = history.filter((item) => item.mark === 'retraso').length
  const abs = history.filter((item) => item.mark === 'ausente').length
  let streak = 0
  for (const item of history) {
    if (item.mark !== 'presente') {
      break
    }
    streak += 1
  }
  const pct =
    history.length === 0 ? '—' : `${Math.round(((history.length - abs) / history.length) * 100)} %`

  return {
    pct,
    late,
    abs,
    streak,
    email: emailOf(name),
    initials: initials(name)
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

export function rollStatus(
  phase: Phase,
  marks: Record<number, Attendance>,
  index: number
): Attendance | 'none' {
  if (phase === 'programada') {
    return 'none'
  }
  return marks[index] ?? 'pendiente'
}

export function rollTime(status: Attendance | 'none', index: number): string {
  if (status === 'presente' || status === 'retraso') {
    return todayEntry[index] ?? '—'
  }
  return '—'
}

export function compareStudentNames(a: string, b: string): number {
  const surname = (name: string): string => name.split(' ').slice(1).join(' ')
  return surname(a).localeCompare(surname(b), 'es') || a.localeCompare(b, 'es')
}

export function sessionDateLabel(id: string): string {
  const day = Number(id.split(' ')[1])
  return new Date(2026, 10, day).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
