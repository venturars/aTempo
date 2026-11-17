import { Link } from '@tanstack/react-router'
import { markClass } from '../../login/trimesterExample'
import { statusLabel, type AttendanceStatus } from '../attendanceStatus'
import { useCurrentStudent } from '../studentAccounts'

const markOf = { presente: 'presente', tarde: 'retraso', ausente: 'ausencia' } as const

function dot(status: AttendanceStatus): string {
  return markClass(markOf[status])
}

export function HistoryScreen(): React.JSX.Element {
  const student = useCurrentStudent()

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-box bg-base-100 p-4 md:p-8">
        <Link to="/student/dashboard" className="link w-fit">
          Volver
        </Link>
        <h1 className="text-3xl font-semibold text-base-content">Historial</h1>
        {student.history.length === 0 ? (
          <p>Todavía no tienes clases.</p>
        ) : (
          <ul className="list">
            {student.history.map((entry) => (
              <li key={entry.label} className="list-row items-center">
                <span>{entry.label}</span>
                <span>{entry.arrival ?? '—'}</span>
                <span className="flex items-center gap-2">
                  <span className={`${dot(entry.status)} shrink-0`} aria-hidden="true" />
                  {statusLabel[entry.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
