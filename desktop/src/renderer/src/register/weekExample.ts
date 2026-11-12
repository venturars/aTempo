import type { AttendanceMark, TrimesterDay } from '../login/trimesterExample'

export const weekPresence = '94% presentes'

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
