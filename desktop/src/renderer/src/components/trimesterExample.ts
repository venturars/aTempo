export type AttendanceMark = 'presente' | 'retraso' | 'ausencia'

export type TrimesterDay = {
  name: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes'
  label: 'L' | 'M' | 'X' | 'J' | 'V'
  marks: AttendanceMark[]
}

const markClasses: Record<AttendanceMark, string> = {
  presente: 'status status-success',
  retraso: 'status status-warning',
  ausencia: 'status status-error'
}

const markLabels: Record<AttendanceMark, string> = {
  presente: 'Presente',
  retraso: 'Retraso',
  ausencia: 'Ausencia'
}

function sessionMarks(): AttendanceMark[] {
  const marks: AttendanceMark[] = []

  for (let index = 0; index < 12; index += 1) {
    marks.push('presente')
  }

  marks.push('retraso', 'ausencia')
  return marks
}

export const trimesterDays: TrimesterDay[] = [
  { name: 'lunes', label: 'L', marks: sessionMarks() },
  { name: 'martes', label: 'M', marks: sessionMarks() },
  { name: 'miércoles', label: 'X', marks: sessionMarks() },
  { name: 'jueves', label: 'J', marks: sessionMarks() },
  { name: 'viernes', label: 'V', marks: sessionMarks() }
]

export function markClass(mark: AttendanceMark): string {
  return markClasses[mark]
}

export function markLabel(mark: AttendanceMark): string {
  return markLabels[mark]
}
