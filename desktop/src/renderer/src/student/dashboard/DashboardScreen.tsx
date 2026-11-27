import { useNavigate } from '@tanstack/react-router'
import type { TextKey } from '../../lang/messages'
import { useText } from '../../lang/useText'
import { useSessionStore } from '../../session/sessionStore'
import { NoStudentSession } from '../NoStudentSession'
import { useCurrentStudent } from '../studentAccounts'

type DashboardActionId =
  'registrar-asistencia' | 'avisar-retrasos-ausencias' | 'proxima-clase' | 'resumen-asistencia'

// Cada línea es la clave de un texto: el botón lo parte en dos si no cabe en una.
type DashboardAction = {
  id: DashboardActionId
  lines: TextKey[]
}

const dashboardActions: DashboardAction[] = [
  { id: 'registrar-asistencia', lines: ['student.dashboard.actions.register'] },
  { id: 'proxima-clase', lines: ['student.dashboard.actions.nextClass'] },
  {
    id: 'avisar-retrasos-ausencias',
    lines: ['student.dashboard.actions.reportLine1', 'student.dashboard.actions.reportLine2']
  },
  { id: 'resumen-asistencia', lines: ['student.dashboard.actions.summary'] }
]

export function DashboardScreen(): React.JSX.Element {
  const t = useText()
  const navigate = useNavigate()
  const student = useCurrentStudent()

  function onDashboardAction(actionId: DashboardActionId): void {
    if (actionId === 'registrar-asistencia') void navigate({ to: '/student/scan' })
    if (actionId === 'resumen-asistencia') void navigate({ to: '/student/history' })
  }

  function logOut(): void {
    useSessionStore.getState().endSession()
    void navigate({ to: '/' })
  }

  if (student === null) {
    return <NoStudentSession />
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="w-full max-w-3xl rounded-box bg-base-100 p-4 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-base-content">
              {t('student.dashboard.title')}
            </h1>
            <p className="mt-2 text-secondary">
              {t('student.dashboard.welcome', { name: student.name })}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={logOut}>
            {t('common.logOut')}
          </button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {dashboardActions.map((action) => (
            <button
              key={action.id}
              id={action.id}
              className="btn input login-field h-auto min-h-16 w-full flex-col gap-0 bg-base-100 font-normal"
              type="button"
              data-action={action.id}
              onClick={() => onDashboardAction(action.id)}
            >
              {action.lines.map((line) => (
                <span key={line}>{t(line)}</span>
              ))}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
