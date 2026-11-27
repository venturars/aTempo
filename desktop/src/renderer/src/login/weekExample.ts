import type { AttendanceMark, TrimesterDay } from './trimesterExample'

function weekMarks(presentCount: number, otherMarks: AttendanceMark[]): AttendanceMark[] {
  const marks: AttendanceMark[] = []

  for (let index = 0; index < presentCount; index += 1) {
    marks.push('presente')
  }

  for (const mark of otherMarks) {
    marks.push(mark)
  }

  return marks
}

export const weekDays: TrimesterDay[] = [
  { date: '2026-11-09', marks: weekMarks(10, ['retraso', 'ausencia']) },
  { date: '2026-11-10', marks: weekMarks(10, ['ausencia', 'ausencia']) },
  { date: '2026-11-11', marks: weekMarks(10, ['retraso', 'ausencia']) },
  { date: '2026-11-12', marks: weekMarks(11, ['ausencia']) },
  { date: '2026-11-13', marks: weekMarks(11, ['retraso']) }
]

// El porcentaje sale del mismo gráfico, para que cuadren: Presente entre todas las marcas.
const allMarks = weekDays.flatMap((day) => day.marks)
const presentMarks = allMarks.filter((mark) => mark === 'presente').length

export const weekPresencePercent = Math.round((presentMarks / allMarks.length) * 100)
