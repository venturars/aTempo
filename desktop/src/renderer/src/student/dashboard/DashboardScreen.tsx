import { dashboardActions, onDashboardAction } from './dashboardActions'

const studentName = 'Ada López'

export function DashboardScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold text-base-content">Dashboard alumno</h1>
        <section className="mt-4 rounded-box bg-base-100 p-8">
          <p className="text-base-content">Bienvenido {studentName}</p>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-x-16 gap-y-6">
            {dashboardActions.map((action) => (
              <button
                key={action.id}
                id={action.id}
                className="btn h-auto min-h-16 w-full flex-col gap-0 rounded-box border border-base-content bg-base-100 font-normal"
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
      </div>
    </main>
  )
}
