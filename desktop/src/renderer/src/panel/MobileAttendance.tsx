import { Avatar } from './avatar'
import { markBadge, markLabel } from './marks'
import { sessionDateLabel, type ClassSession } from './roster'

type StudentSummary = {
  name: string
  attended: number
  absent: number
  late: number
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
    <section
      className="mobile-attendance border-t border-base-content/4"
      aria-label="Asistencia por alumno"
    >
      {students.map((student) => (
        <details
          key={student.name}
          className="group border-b border-base-content/4 px-5 last:border-b-0"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 py-3">
            <Avatar name={student.name} compact />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{student.name}</span>
              <span className="mt-0.5 block text-sm text-base-content/60">
                {student.absent === 0
                  ? 'Sin ausencias'
                  : `${student.absent} ${student.absent === 1 ? 'ausencia' : 'ausencias'}`}
                {student.late > 0
                  ? ` · ${student.late} ${student.late === 1 ? 'retraso' : 'retrasos'}`
                  : ''}
              </span>
            </span>
            <span className="text-sm font-medium tabular-nums text-base-content/50">
              {Math.round((student.attended / sessions.length) * 100)} %
            </span>
            <svg
              aria-hidden="true"
              className="size-4 shrink-0 text-base-content/50 group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m6 8 4 4 4-4" />
            </svg>
          </summary>
          <div className="flex flex-col gap-3 pb-4 pl-9">
            <ul
              className="divide-y divide-base-content/4"
              aria-label={`Sesiones de ${student.name}`}
            >
              {[...sessions].reverse().map((session) => {
                const row = session.rows?.find((record) => record.name === student.name)
                return (
                  <li key={session.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm">{sessionDateLabel(session.id)}</span>
                    <span className="inline-flex items-center gap-2">
                      {row && row.time !== '—' ? (
                        <time className="text-sm tabular-nums text-base-content/60">
                          {row.time}
                        </time>
                      ) : null}
                      <span className={row ? markBadge[row.mark] : markBadge['sin-registro']}>
                        {row ? markLabel[row.mark] : markLabel['sin-registro']}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="btn btn-sm w-fit"
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
