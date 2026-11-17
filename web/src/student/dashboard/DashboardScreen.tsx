import { useNavigate } from '@tanstack/react-router'
import { useCurrentStudent } from '../studentAccounts'

const actions = [
  {
    id: 'registrar-asistencia',
    label: 'Registrar asistencia',
    to: '/student/scan',
    primary: true
  },
  { id: 'proxima-clase', label: 'Próxima clase', to: null, primary: false },
  {
    id: 'avisar-retrasos-ausencias',
    label: 'Avisar de retrasos o ausencias',
    to: null,
    primary: false
  },
  {
    id: 'resumen-asistencia',
    label: 'Resumen de asistencia',
    to: '/student/history',
    primary: false
  }
] as const

export function DashboardScreen(): React.JSX.Element {
  const student = useCurrentStudent()
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 p-4 md:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm">aTempo</p>
        <h1 className="text-2xl font-medium">Hola, {student.name}</h1>
      </header>
      <div className="flex flex-col gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            id={action.id}
            className={
              action.primary
                ? 'btn btn-primary btn-xl btn-block'
                : 'btn btn-outline btn-xl btn-block'
            }
            type="button"
            onClick={() => {
              if (action.to !== null) void navigate({ to: action.to })
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </main>
  )
}
