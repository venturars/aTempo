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
  { name: 'lunes', label: 'L', marks: weekMarks(10, ['retraso', 'ausencia']) },
  { name: 'martes', label: 'M', marks: weekMarks(10, ['ausencia', 'ausencia']) },
  { name: 'miércoles', label: 'X', marks: weekMarks(10, ['retraso', 'ausencia']) },
  { name: 'jueves', label: 'J', marks: weekMarks(11, ['ausencia']) },
  { name: 'viernes', label: 'V', marks: weekMarks(11, ['retraso']) }
]

// El porcentaje sale del mismo gráfico, para que cuadren: Presente entre todas las marcas.
const allMarks = weekDays.flatMap((day) => day.marks)
const presentMarks = allMarks.filter((mark) => mark === 'presente').length

export const weekPresence = `${Math.round((presentMarks / allMarks.length) * 100)} % presentes`
