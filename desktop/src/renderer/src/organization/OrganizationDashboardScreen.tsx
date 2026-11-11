import {
  organizationExample,
  type CourseMetric,
  type OrganizationDashboard,
  type ReviewStudent
} from './organizationExample'

const upcomingAreas = ['Cursos y calendario', 'Alumnos', 'Profesores', 'Juegos', 'Settings']

type DashboardProps = { model?: OrganizationDashboard }

export function OrganizationDashboardScreen({
  model = organizationExample
}: DashboardProps): React.JSX.Element {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <OrganizationNavigation organization={model.organization} />
      <div className="min-w-0">
        <OrganizationHeader model={model} />
        <main className="mx-auto flex max-w-[1440px] flex-col gap-6 p-5 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-sm text-base-content/60">Organización / Dashboard</p>
              <h1 className="text-2xl font-semibold">Una mirada a la asistencia</h1>
            </div>
            <p className="badge badge-ghost h-auto py-2 text-meta">Prototipo · Datos ficticios</p>
          </div>
          <ReviewSummary model={model} />
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <CourseOverview model={model} />
            <ReviewStudents model={model} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <PendingOverview model={model} />
            <DataQuality model={model} />
          </div>
          <p className="text-meta text-base-content/60">
            Vista informativa. Los avisos no aplican sanciones.
          </p>
        </main>
      </div>
    </div>
  )
}

function OrganizationNavigation({ organization }: { organization: string }): React.JSX.Element {
  return (
    <aside className="flex flex-col gap-6 bg-base-100 p-5 lg:min-h-screen lg:p-6">
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-xl bg-primary font-semibold text-primary-content"
          aria-hidden="true"
        >
          a
        </span>
        <p className="text-xl font-semibold tracking-tight">aTempo</p>
      </div>
      <div className="hidden border-b border-base-300 pb-5 lg:block">
        <p className="text-xs font-medium uppercase tracking-widest text-base-content/60">
          Tu organización
        </p>
        <p className="mt-2 text-sm font-medium">{organization}</p>
      </div>
      <nav aria-label="Administración de la organización">
        <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-3">
          <li>
            <span
              aria-current="page"
              className="flex items-center gap-3 rounded-field bg-primary/10 px-3 py-3 text-sm font-medium text-primary"
            >
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Dashboard
            </span>
          </li>
          {upcomingAreas.map((area) => (
            <li key={area} className="flex flex-col gap-1 rounded-field px-3 py-2 lg:py-3">
              <span className="text-sm text-base-content/70">{area}</span>
              <span className="text-xs text-base-content/50">Próximamente</span>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-auto hidden border-t border-base-300 pt-5 text-meta text-base-content/50 lg:block">
        Cada sesión cuenta.
      </p>
    </aside>
  )
}

function OrganizationHeader({ model }: { model: OrganizationDashboard }): React.JSX.Element {
  const hasPendingNotices = model.pending.some((item) => item.count > 0)

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 bg-base-100 px-5 py-4 md:px-8">
      <div>
        <p className="font-medium">{model.organization}</p>
        <p className="mt-1 text-meta text-base-content/60">{model.period}</p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        {hasPendingNotices ? (
          <span className="badge badge-warning badge-soft h-auto py-2 text-meta">
            Avisos pendientes
          </span>
        ) : null}
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-sm font-medium"
            aria-hidden="true"
          >
            {model.profile.initials}
          </span>
          <div>
            <p className="text-sm font-medium">{model.profile.name}</p>
            <p className="text-meta text-base-content/60">{model.profile.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function ReviewSummary({ model }: { model: OrganizationDashboard }): React.JSX.Element {
  return (
    <section aria-labelledby="review-summary" className="card bg-base-100">
      <div className="card-body grid gap-6 p-6 md:grid-cols-[minmax(180px,0.7fr)_minmax(0,1fr)] md:gap-8">
        <div className="stat min-w-0 p-0">
          <h2 id="review-summary" className="stat-title text-sm text-base-content/70">
            Estudiantes a revisar
          </h2>
          <p className="stat-value my-2 text-6xl font-medium tracking-tight">
            {model.reviewStudentCount}
          </p>
          <p className="text-meta text-base-content/60">Cada estudiante cuenta una sola vez.</p>
          {model.provisional ? (
            <span className="badge badge-warning badge-soft mt-3">Provisional</span>
          ) : null}
        </div>
        <div className="border-t border-base-300 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <h3 className="text-sm font-medium">Patrones que merecen atención</h3>
          <p className="mt-2 text-meta text-base-content/60">
            Señales para acompañar a tus estudiantes.
          </p>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-error" aria-hidden="true" />
              <span>
                <strong className="font-medium">Ausencias recurrentes</strong>
                <br />
                <span className="text-base-content/70">
                  Al menos 3 no justificadas en las últimas 5 sesiones.
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              <span>
                <strong className="font-medium">Retrasos recurrentes</strong>
                <br />
                <span className="text-base-content/70">Al menos 4 en las últimas 6 sesiones.</span>
              </span>
            </li>
          </ul>
          <p className="mt-4 text-meta text-base-content/60">
            Los justificantes aprobados se excluyen del patrón.
          </p>
        </div>
      </div>
    </section>
  )
}

function MetricValue({ metric }: { metric: CourseMetric }): React.JSX.Element {
  if (
    metric.base === null ||
    metric.base <= 0 ||
    metric.count === null ||
    metric.percentage === null
  ) {
    return <span className="text-sm text-base-content/60">Sin datos</span>
  }
  return (
    <div className="flex flex-col gap-1 tabular-nums">
      <span className="font-medium">{metric.percentage}</span>
      <span className="text-meta text-base-content/60">
        {metric.count} de {metric.base}
      </span>
    </div>
  )
}

function CourseOverview({ model }: { model: OrganizationDashboard }): React.JSX.Element {
  return (
    <section aria-labelledby="courses-heading" className="card min-w-0 bg-base-100">
      <div className="card-body gap-4 p-6">
        <div>
          <h2 id="courses-heading" className="text-base font-medium">
            Asistencia por curso
          </h2>
          <p className="mt-1 text-meta text-base-content/60">{model.period}</p>
        </div>
        {model.courses.length === 0 ? (
          <p className="py-6 text-sm text-base-content/70">Sin datos de cursos en este periodo.</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="table w-full">
              <caption className="sr-only">
                Ausencias y retrasos por curso en el periodo visible
              </caption>
              <thead>
                <tr>
                  <th scope="col">Curso</th>
                  <th scope="col">Ausencias</th>
                  <th scope="col">Retrasos</th>
                </tr>
              </thead>
              <tbody>
                {model.courses.map((course) => (
                  <tr key={course.id}>
                    <th
                      scope="row"
                      className="min-w-36 py-4 font-normal normal-case tracking-normal"
                    >
                      <span className="block text-sm font-medium">{course.name}</span>
                      <span className="mt-1 block text-meta text-base-content/60">
                        {course.teacher}
                      </span>
                      {course.provisional ? (
                        <span className="mt-2 block text-meta font-normal text-warning">
                          Provisional
                        </span>
                      ) : null}
                    </th>
                    <td>
                      <MetricValue metric={course.absences} />
                      <span className="mt-1 block whitespace-nowrap text-meta text-base-content/60">
                        {course.justifiedAbsences} justificadas
                      </span>
                    </td>
                    <td>
                      <MetricValue metric={course.delays} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-base-300 pt-4 text-meta leading-relaxed text-base-content/60">
          <p>
            Ausencias sobre registros alumno-sesión esperados. Las justificadas se incluyen en la
            tabla.
          </p>
          <p className="mt-2">
            Retrasos sobre asistencias con entrada: desde el minuto 11, con 10 minutos de
            tolerancia. Se usa el inicio efectivo si el profesor avisó.
          </p>
        </div>
      </div>
    </section>
  )
}

function StudentRow({ student }: { student: ReviewStudent }): React.JSX.Element {
  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-base-200 text-meta font-medium"
        aria-hidden="true"
      >
        {student.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h3 className="text-sm font-medium">{student.name}</h3>
          {student.provisional ? <span className="text-meta text-warning">Provisional</span> : null}
        </div>
        <p className="mt-1 text-meta text-base-content/60">{student.course}</p>
        <ul className="mt-2 flex flex-col gap-1">
          {student.patterns.map((pattern) => (
            <li key={pattern.kind} className="flex items-center gap-2 text-meta">
              <span
                className={`size-1.5 shrink-0 rounded-full ${pattern.kind === 'absence' ? 'bg-error' : 'bg-warning'}`}
                aria-hidden="true"
              />
              {pattern.label}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function ReviewStudents({ model }: { model: OrganizationDashboard }): React.JSX.Element {
  return (
    <section aria-labelledby="students-heading" className="card bg-base-100">
      <div className="card-body gap-5 p-6">
        <div>
          <h2 id="students-heading" className="text-base font-medium">
            Estudiantes a acompañar
          </h2>
          <p className="mt-1 text-meta text-base-content/60">El patrón explica cada aviso.</p>
        </div>
        {model.students.length === 0 ? (
          <p className="py-6 text-sm text-base-content/70">
            No hay estudiantes a revisar en este periodo.
          </p>
        ) : (
          <ul className="divide-y divide-base-300">
            {model.students.map((student) => (
              <StudentRow key={student.id} student={student} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function PendingOverview({ model }: { model: OrganizationDashboard }): React.JSX.Element {
  return (
    <section aria-labelledby="pending-heading" className="card bg-base-100">
      <div className="card-body gap-5 p-6">
        <h2 id="pending-heading" className="text-base font-medium">
          Pendientes de la organización
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {model.pending.map((item) => (
            <li key={item.label} className="border-l-2 border-base-300 pl-3">
              <p className="text-2xl font-medium tabular-nums">{item.count}</p>
              <p className="mt-2 text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-meta text-base-content/60">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function DataQuality({ model }: { model: OrganizationDashboard }): React.JSX.Element {
  return (
    <section aria-labelledby="quality-heading" className="card bg-base-100">
      <div className="card-body gap-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="quality-heading" className="text-base font-medium">
            Calidad de los datos
          </h2>
          {model.provisional ? (
            <span className="badge badge-warning badge-soft">Provisional</span>
          ) : null}
        </div>
        {model.quality.map((message) => (
          <p key={message} className="text-meta leading-relaxed text-base-content/70">
            {message}
          </p>
        ))}
      </div>
    </section>
  )
}
