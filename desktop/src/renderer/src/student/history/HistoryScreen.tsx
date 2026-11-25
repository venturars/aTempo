import { Link } from '@tanstack/react-router'
import { formatTime } from '../../language/format'
import { useText } from '../../language/useText'
import { markClass } from '../../login/trimesterExample'
import { statusLabelKey, type AttendanceStatus } from '../attendanceStatus'
import { classDayLabel } from '../classDate'
import { NoStudentSession } from '../NoStudentSession'
import { useCurrentStudent } from '../studentAccounts'

const markOf = { presente: 'presente', tarde: 'retraso', ausente: 'ausencia' } as const

function dot(status: AttendanceStatus): string {
  return markClass(markOf[status])
}

export function HistoryScreen(): React.JSX.Element {
  const t = useText()
  const student = useCurrentStudent()
  if (student === null) {
    return <NoStudentSession />
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-box bg-base-100 p-4 md:p-8">
        <Link to="/student/dashboard" className="link w-fit">
          {t('common.back')}
        </Link>
        <h1 className="text-3xl font-semibold text-base-content">{t('student.history.title')}</h1>
        {student.history.length === 0 ? (
          <p>{t('student.history.empty')}</p>
        ) : (
          <ul className="list">
            {student.history.map((entry) => (
              <li key={entry.date} className="list-row items-center">
                <span>{classDayLabel(entry.date)}</span>
                <span>{entry.arrival === null ? '—' : formatTime(entry.arrival)}</span>
                <span className="flex items-center gap-2">
                  <span className={`${dot(entry.status)} shrink-0`} aria-hidden="true" />
                  {t(statusLabelKey[entry.status])}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
