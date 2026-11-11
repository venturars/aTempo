import { AttendanceStatus } from './AttendanceStatus'
import { sessionDateLabel, type ClassSession } from './roster'

type StudentSummary = {
  name: string
  attended: number
  absent: number
  late: number
}

const statusLabels = {
  presente: 'Presente',
  retraso: 'Retraso',
  ausente: 'Ausencia',
  pendiente: 'Pendiente'
}

export function MobileAttendance({
  students,
  sessions,
  onOpenStudent
}: {
  students: StudentSummary[]
  sessions: ClassSession[]
  onOpenStudent: (name: string) => void
}): React.JSX.Element {
  return (
    <section className="mobile-attendance" aria-label="Asistencia por alumno">
      {students.map((student) => (
        <details key={student.name} className="mobile-student">
          <summary>
            <span className="mobile-student-name">
              <span>{student.name}</span>
              <span className="mobile-student-counts">
                {student.absent === 0
                  ? 'Sin ausencias'
                  : `${student.absent} ${student.absent === 1 ? 'ausencia' : 'ausencias'}`}
                {student.late > 0
                  ? ` · ${student.late} ${student.late === 1 ? 'retraso' : 'retrasos'}`
                  : ''}
              </span>
            </span>
            <span className="mobile-student-percentage tabular-nums">
              {Math.round((student.attended / sessions.length) * 100)}%
            </span>
            <svg
              className="mobile-student-chevron"
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m6 8 4 4 4-4" />
            </svg>
          </summary>
          <div className="mobile-student-detail">
            <ul aria-label={`Sesiones de ${student.name}`}>
              {[...sessions].reverse().map((session) => {
                const row = session.rows?.find((record) => record.name === student.name)
                return (
                  <li key={session.id}>
                    <span>{sessionDateLabel(session.id)}</span>
                    <span className="mobile-session-status">
                      <span className="sr-only">
                        {row ? statusLabels[row.mark] : 'Sin registro'}
                      </span>
                      {row && row.time !== '—' ? <time>{row.time}</time> : null}
                      <AttendanceStatus mark={row?.mark ?? 'sin-registro'} />
                    </span>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onOpenStudent(student.name)}
            >
              Ver ficha
            </button>
          </div>
        </details>
      ))}
    </section>
  )
}
