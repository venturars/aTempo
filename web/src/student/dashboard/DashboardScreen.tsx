import { useNavigate } from '@tanstack/react-router'
import { useCurrentStudent } from '../studentAccounts'

const actions = [
  { id: 'registrar-asistencia', lines: ['Registrar asistencia'], to: '/student/scan' },
  { id: 'proxima-clase', lines: ['Próxima clase'], to: null },
  { id: 'avisar-retrasos-ausencias', lines: ['Avisar de retrasos', 'o ausencias'], to: null },
  { id: 'resumen-asistencia', lines: ['Resumen de asistencia'], to: '/student/history' }
] as const

export function DashboardScreen(): React.JSX.Element {
  const student = useCurrentStudent()
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="w-full max-w-3xl rounded-box bg-base-100 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Dashboard alumno</h1>
        <p className="mt-2 text-secondary">Bienvenido {student.name}</p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {actions.map((action) => (
            <button
              key={action.id}
              id={action.id}
              className="btn h-auto min-h-16 w-full flex-col gap-0 bg-base-100 font-normal"
              type="button"
              onClick={() => {
                if (action.to !== null) void navigate({ to: action.to })
              }}
            >
              {action.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
