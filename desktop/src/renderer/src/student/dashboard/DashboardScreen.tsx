type DashboardActionId =
  | 'registrar-asistencia'
  | 'avisar-retrasos-ausencias'
  | 'proxima-clase'
  | 'resumen-asistencia'

type DashboardAction = {
  id: DashboardActionId
  lines: string[]
}

const dashboardActions: DashboardAction[] = [
  { id: 'registrar-asistencia', lines: ['Registrar asistencia'] },
  { id: 'proxima-clase', lines: ['Próxima clase'] },
  { id: 'avisar-retrasos-ausencias', lines: ['Avisar de retrasos', 'o ausencias'] },
  { id: 'resumen-asistencia', lines: ['Resumen de asistencia'] }
]

function onDashboardAction(actionId: DashboardActionId): void {
  void actionId
}

const studentName = 'Ada López'

export function DashboardScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-3xl rounded-box bg-base-100 p-8">
        <h1 className="text-3xl font-semibold text-base-content">Dashboard alumno</h1>
        <p className="mt-2 text-secondary">Bienvenido {studentName}</p>
        <div className="mt-8 grid grid-cols-2 gap-5">
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
                <span key={line}>{line}</span>
              ))}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
