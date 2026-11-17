import { Link } from '@tanstack/react-router'
import { statusLabel, statusMarkClass } from '../attendanceStatus'
import { useCurrentStudent } from '../studentAccounts'

export function HistoryScreen(): React.JSX.Element {
  const student = useCurrentStudent()

  return (
    <main className="flex min-h-screen justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-5">
        <Link to="/student/dashboard" className="link w-fit">
          Volver
        </Link>
        <h1 className="text-2xl font-medium">Historial</h1>
        {student.history.length === 0 ? (
          <p>Todavía no tienes clases.</p>
        ) : (
          <ul className="list">
            {student.history.map((entry) => (
              <li key={entry.label} className="list-row items-center">
                <span className={`${statusMarkClass(entry.status)} shrink-0`} aria-hidden="true" />
                <span>{entry.label}</span>
                <span>{entry.arrival ?? '—'}</span>
                <span>{statusLabel[entry.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
