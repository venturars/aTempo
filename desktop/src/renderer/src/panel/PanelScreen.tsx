import { useState } from 'react'
import { usePanelStore, type PanelTab } from './panelStore'
import {
  classSessions,
  course,
  initialsOf,
  monthReport,
  rollStatus,
  rollTime,
  rosterNames,
  sessionCounts,
  studentHistory,
  studentSummary,
  todayLabel,
  type Attendance,
  type ClassSession,
  type JustKey,
  type Phase,
  type RosterRow
} from './roster'

const tabs: { id: PanelTab; label: string }[] = [
  { id: 0, label: 'Hoy' },
  { id: 1, label: 'Clases' },
  { id: 2, label: 'Estadísticas' },
  { id: 3, label: 'Ajustes' }
]

const markLabel: Record<Attendance, string> = {
  presente: 'Presente',
  retraso: 'Tarde',
  ausente: 'Ausente',
  pendiente: 'Pendiente'
}

const markClass: Record<Attendance, string> = {
  presente: 'badge badge-soft badge-success',
  retraso: 'badge badge-soft badge-warning',
  ausente: 'badge badge-soft badge-error',
  pendiente: 'badge badge-soft badge-neutral'
}

const justLabel: Record<JustKey, string> = {
  none: '',
  pend: 'Pendiente',
  ok: 'Aprobado',
  no: 'Sin justificante'
}

const justClass: Record<JustKey, string> = {
  none: '',
  pend: 'badge badge-soft badge-warning',
  ok: 'badge badge-soft badge-success',
  no: 'text-sm opacity-60'
}

export function PanelScreen(): React.JSX.Element {
  const tab = usePanelStore((state) => state.tab)
  const classId = usePanelStore((state) => state.classId)
  const studentName = usePanelStore((state) => state.studentName)
  const setTab = usePanelStore((state) => state.setTab)
  const goBack = usePanelStore((state) => state.goBack)
  const selected = classSessions.find((session) => session.id === classId) ?? null
  const title = pageTitle(tab, selected, studentName)
  const crumbs = crumbTrail(tab, selected, studentName, title)

  return (
    <div className="grid min-h-screen grid-cols-1 bg-base-200 md:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col border-base-content/10 bg-base-100 md:sticky md:top-0 md:h-screen md:border-r">
        <p className="px-5 pt-6 pb-4 text-sm font-semibold tracking-tight">aTempo</p>
        <nav className="flex flex-col gap-0.5 px-3" aria-label="Secciones">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                tab === item.id
                  ? 'rounded-lg bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary'
                  : 'rounded-lg px-3 py-2 text-left text-sm text-base-content/70 hover:bg-base-200'
              }
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-base-content/10 px-5 py-4">
          <span className="grid size-8 place-items-center rounded-full bg-base-200 text-xs font-medium">
            PR
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium">Paula Rivas</span>
            <span className="text-xs text-base-content/60">Profesora</span>
          </span>
        </div>
      </aside>
      <main className="flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-1">
          <Breadcrumb crumbs={crumbs} onBack={goBack} onRoot={() => setTab(tab)} />
          {tab === 0 && studentName === null ? (
            <p className="text-sm opacity-60">{todayLabel}</p>
          ) : null}
        </header>
        {studentName !== null ? (
          <StudentFile name={studentName} />
        ) : tab === 0 ? (
          <TodayView />
        ) : tab === 1 ? (
          <ClassesView selected={selected} />
        ) : tab === 2 ? (
          <StatsView />
        ) : (
          <SettingsView />
        )}
      </main>
      <CloseDialog />
    </div>
  )
}

function pageTitle(
  tab: PanelTab,
  selected: ClassSession | null,
  studentName: string | null
): string {
  if (studentName !== null) {
    return studentName
  }
  if (tab === 1 && selected !== null) {
    return selected.title
  }
  return tabs[tab]?.label ?? 'Hoy'
}

type Crumb = {
  label: string
  action: 'root' | 'back' | 'current'
}

function crumbTrail(
  tab: PanelTab,
  selected: ClassSession | null,
  studentName: string | null,
  title: string
): Crumb[] {
  const section = tabs[tab]?.label ?? 'Hoy'
  if (studentName !== null && tab === 1 && selected !== null) {
    return [
      { label: 'Clases', action: 'root' },
      { label: selected.title, action: 'back' },
      { label: title, action: 'current' }
    ]
  }
  if (studentName !== null) {
    return [
      { label: section, action: 'root' },
      { label: title, action: 'current' }
    ]
  }
  if (tab === 1 && selected !== null) {
    return [
      { label: 'Clases', action: 'root' },
      { label: title, action: 'current' }
    ]
  }
  return [{ label: title, action: 'current' }]
}

function Breadcrumb({
  crumbs,
  onBack,
  onRoot
}: {
  crumbs: Crumb[]
  onBack: () => void
  onRoot: () => void
}): React.JSX.Element {
  if (crumbs.length === 1) {
    return <h1 className="text-xl font-medium">{crumbs[0]?.label}</h1>
  }

  return (
    <nav className="breadcrumbs text-sm" aria-label="Ruta">
      <ul>
        {crumbs.map((crumb) => (
          <li
            key={crumb.label}
            className={crumb.action === 'current' ? '[&>*]:cursor-default' : ''}
          >
            {crumb.action === 'current' ? (
              <h1 className="text-xl font-medium hover:no-underline">{crumb.label}</h1>
            ) : (
              <button
                type="button"
                className="text-primary"
                onClick={crumb.action === 'root' ? onRoot : onBack}
              >
                {crumb.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TodayView(): React.JSX.Element {
  const phase = usePanelStore((state) => state.phase)
  const marks = usePanelStore((state) => state.marks)
  const openSession = usePanelStore((state) => state.openSession)
  const askClose = usePanelStore((state) => state.askClose)
  const reopenSession = usePanelStore((state) => state.reopenSession)
  const openStudent = usePanelStore((state) => state.openStudent)
  const setMark = usePanelStore((state) => state.setMark)
  const statuses = rosterNames.map((_, index) => rollStatus(phase, marks, index))
  const present = statuses.filter((status) => status === 'presente').length
  const late = statuses.filter((status) => status === 'retraso').length
  const third =
    phase === 'cerrada'
      ? statuses.filter((status) => status === 'ausente').length
      : statuses.filter((status) => status === 'pendiente').length

  return (
    <section className="overflow-hidden rounded-box bg-base-100 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">{course.name}</h2>
            {phase === 'programada' ? null : <PhaseChip phase={phase} />}
          </div>
          <p className="text-sm text-base-content/60">
            {course.time} · {course.room} · {rosterNames.length} alumnos
          </p>
        </div>
        {phase === 'programada' ? (
          <button type="button" className="btn btn-primary" onClick={openSession}>
            Pasar lista
          </button>
        ) : null}
        {phase === 'abierta' ? (
          <button type="button" className="btn" onClick={askClose}>
            Finalizar
          </button>
        ) : null}
        {phase === 'cerrada' ? (
          <button type="button" className="btn" onClick={reopenSession}>
            Volver a abrir
          </button>
        ) : null}
      </div>
      {phase === 'programada' ? null : (
        <div className="grid grid-cols-3 border-t border-base-content/10 px-5 py-4">
          <Stat value={String(present)} label="Presentes" />
          <Stat value={String(late)} label="Tarde" />
          <Stat value={String(third)} label={phase === 'cerrada' ? 'Ausentes' : 'Pendientes'} />
        </div>
      )}
      <div className="overflow-x-auto border-t border-base-content/10">
        <table className="table">
          <thead>
            <tr className="[&_th]:text-xs [&_th]:font-medium [&_th]:normal-case [&_th]:text-base-content/50">
              <th>Alumno</th>
              <th>Entrada</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rosterNames.map((name, index) => {
              const status = statuses[index] ?? 'none'
              return (
                <tr key={name} className="h-14">
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={name} />
                      <button
                        type="button"
                        className="font-medium"
                        onClick={() => openStudent(name)}
                      >
                        {name}
                      </button>
                      {name === 'Pablo Jiménez' ? <RiskHint /> : null}
                    </div>
                  </td>
                  <td className="tabular-nums text-base-content/70">{rollTime(status, index)}</td>
                  <td>
                    <MarkControl
                      status={status}
                      enabled={phase === 'abierta'}
                      onPick={(mark) => setMark(index, mark)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ClassesView({ selected }: { selected: ClassSession | null }): React.JSX.Element {
  const openClass = usePanelStore((state) => state.openClass)
  const openStudent = usePanelStore((state) => state.openStudent)

  if (selected === null) {
    return (
      <section className="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <ul>
          {classSessions.map((session) => {
            const counts = session.rows === null ? null : sessionCounts(session.rows)
            return (
              <li key={session.id} className="border-t border-base-content/10 first:border-t-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-6 px-5 py-4 text-left hover:bg-base-200 disabled:opacity-50"
                  disabled={session.cancel}
                  onClick={() => openClass(session.id)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{session.title}</span>
                    <span className="block text-sm text-base-content/60">
                      {session.dow} · {session.time} · {session.room}
                    </span>
                  </span>
                  {counts !== null ? (
                    <span className="hidden shrink-0 items-center gap-6 md:flex">
                      <Count value={counts.p} label="Presentes" />
                      <Count value={counts.r} label="Tarde" />
                      <Count value={counts.a} label="Ausentes" />
                    </span>
                  ) : (
                    <span className="hidden w-60 md:block" />
                  )}
                  <span
                    className={
                      session.cancel
                        ? 'badge badge-soft badge-error'
                        : 'badge badge-soft badge-neutral'
                    }
                  >
                    {session.state}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  const rows = selected.rows ?? []
  const counts = sessionCounts(rows)

  return (
    <section className="overflow-hidden rounded-box bg-base-100 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5">
        <h2 className="text-base font-medium">{course.name}</h2>
        <span className="badge badge-soft badge-neutral">{selected.state}</span>
      </div>
      <p className="px-5 pt-1 text-sm text-base-content/60">
        {selected.dow} · {selected.time} · {selected.room}
      </p>
      <div className="grid grid-cols-3 px-5 py-4">
        <Stat value={String(counts.p)} label="Presentes" />
        <Stat value={String(counts.r)} label="Tarde" />
        <Stat value={String(counts.a)} label="Ausentes" />
      </div>
      <AttendanceTable rows={rows} onOpen={openStudent} />
    </section>
  )
}

function StatsView(): React.JSX.Element {
  const openStudent = usePanelStore((state) => state.openStudent)
  const openClass = usePanelStore((state) => state.openClass)
  const setTab = usePanelStore((state) => state.setTab)
  const report = monthReport()
  const held = classSessions.filter((session) => session.rows !== null)
  const mostAbsent = report.follow[0]
  const summary =
    mostAbsent === undefined
      ? `En noviembre han venido un ${report.pct} %.`
      : `En noviembre han venido un ${report.pct} %. ${mostAbsent.name.split(' ')[0]} es quien más falta.`

  function showClass(id: string): void {
    setTab(1)
    openClass(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-base-content/70">{summary}</p>
      <section className="grid grid-cols-2 rounded-box bg-base-100 px-5 py-4 shadow-sm md:grid-cols-4">
        <Stat value={`${report.pct} %`} label="Han venido" />
        <Stat value={String(report.sessions)} label="Sesiones" />
        <Stat value={String(report.late)} label="Tarde" />
        <Stat value={String(report.absent)} label="Ausencias" />
      </section>
      <section className="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <h2 className="px-5 pt-5 text-base font-medium">Justificantes</h2>
        <p className="px-5 pt-1 text-sm text-base-content/60">
          Los que todavía piden una respuesta.
        </p>
        <ul className="mt-2">
          {report.excuses.map((excuse) => (
            <li
              key={`${excuse.name}-${excuse.title}-${excuse.just}`}
              className="border-t border-base-content/10"
            >
              <div className="flex items-center gap-3 px-5 py-3">
                <Avatar name={excuse.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <button
                    type="button"
                    className="w-fit text-left font-medium"
                    onClick={() => openStudent(excuse.name)}
                  >
                    {excuse.name}
                  </button>
                  <span className="text-sm text-base-content/60">{excuse.title}</span>
                </span>
                <span
                  className={
                    excuse.just === 'pend'
                      ? 'badge badge-soft badge-warning'
                      : 'badge badge-soft badge-error'
                  }
                >
                  {excuse.just === 'pend' ? 'Por revisar' : 'Sin justificante'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <h2 className="px-5 pt-5 text-base font-medium">A quién hablar</h2>
        <p className="px-5 pt-1 text-sm text-base-content/60">Quien ha faltado en noviembre.</p>
        <ul className="mt-2">
          {report.follow.map((person) => (
            <li key={person.name} className="border-t border-base-content/10">
              <div className="flex items-center gap-3 px-5 py-3">
                <Avatar name={person.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <button
                    type="button"
                    className="w-fit text-left font-medium"
                    onClick={() => openStudent(person.name)}
                  >
                    {person.name}
                  </button>
                  <span className="text-sm text-base-content/60">
                    {absenceLine(person.abs, person.late)} · {person.pct} %
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <h2 className="px-5 pt-5 text-base font-medium">Últimas clases</h2>
        <ul className="mt-2">
          {held.map((session) => {
            const counts = sessionCounts(session.rows ?? [])
            return (
              <li key={session.id} className="border-t border-base-content/10">
                <button
                  type="button"
                  className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-base-200"
                  onClick={() => showClass(session.id)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{session.title}</span>
                    <span className="block text-sm text-base-content/60">{session.dow}</span>
                  </span>
                  <span className="text-sm text-base-content/70">{sessionLine(counts)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function absenceLine(abs: number, late: number): string {
  const absences = abs === 1 ? '1 ausencia' : `${abs} ausencias`
  if (late === 0) {
    return absences
  }
  const lates = late === 1 ? '1 retraso' : `${late} retrasos`
  return `${absences} · ${lates}`
}

function sessionLine(counts: { p: number; r: number; a: number }): string {
  if (counts.a === 0 && counts.r === 0) {
    return 'Todos presentes'
  }
  const parts = []
  if (counts.a > 0) {
    parts.push(counts.a === 1 ? '1 ausencia' : `${counts.a} ausencias`)
  }
  if (counts.r > 0) {
    parts.push(counts.r === 1 ? '1 retraso' : `${counts.r} retrasos`)
  }
  return parts.join(' · ')
}

function SettingsView(): React.JSX.Element {
  const [autoClose, setAutoClose] = useState(true)
  const [lateNotice, setLateNotice] = useState(true)
  const [notifyJust, setNotifyJust] = useState(true)
  const [notifyRisk, setNotifyRisk] = useState(false)
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? 'atempo-oscuro'
  )

  function chooseTheme(next: 'atempo-oscuro' | 'atempo-claro'): void {
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body gap-2">
          <h2 className="font-medium">Sesiones</h2>
          <ToggleRow
            label="Cierre automático"
            hint="Al terminar la hora programada"
            checked={autoClose}
            onChange={setAutoClose}
          />
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="flex flex-col">
              <span>Margen de retraso</span>
              <span className="text-sm opacity-60">Minutos tras el inicio</span>
            </span>
            <span>10 min</span>
          </div>
          <ToggleRow
            label="Aviso de alumno"
            hint="Permitir «llegaré tarde»"
            checked={lateNotice}
            onChange={setLateNotice}
          />
        </div>
      </section>
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body gap-2">
          <h2 className="font-medium">Notificaciones</h2>
          <ToggleRow
            label="Justificante nuevo"
            hint="Correo y en la app"
            checked={notifyJust}
            onChange={setNotifyJust}
          />
          <ToggleRow
            label="Riesgo de ausencia"
            hint="Alerta predictiva semanal"
            checked={notifyRisk}
            onChange={setNotifyRisk}
          />
        </div>
      </section>
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body gap-3">
          <h2 className="font-medium">Tema</h2>
          <div className="join">
            <button
              type="button"
              className={theme === 'atempo-oscuro' ? 'btn btn-primary join-item' : 'btn join-item'}
              onClick={() => chooseTheme('atempo-oscuro')}
            >
              Noche
            </button>
            <button
              type="button"
              className={theme === 'atempo-claro' ? 'btn btn-primary join-item' : 'btn join-item'}
              onClick={() => chooseTheme('atempo-claro')}
            >
              Tinta
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function StudentFile({ name }: { name: string }): React.JSX.Element {
  const summary = studentSummary(name)
  const history = studentHistory(name)

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-box bg-base-100 px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-base-200 text-sm font-medium">
            {summary.initials}
          </span>
          <span className="text-sm text-base-content/60">
            {summary.email} · {course.name}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4">
          <Stat value={summary.pct} label="Asistencia" />
          <Stat value={String(summary.late)} label="Tarde" />
          <Stat value={String(summary.abs)} label="Ausencias" />
          <Stat value={String(summary.streak)} label="Racha" />
        </div>
      </section>
      <div className="overflow-x-auto rounded-box bg-base-100 shadow-sm">
        <table className="table">
          <caption className="px-5 pt-5 text-left text-base font-medium">Historial</caption>
          <thead>
            <tr className="[&_th]:text-xs [&_th]:font-medium [&_th]:normal-case [&_th]:text-base-content/50">
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Estado</th>
              <th>Justificante</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.title} className="h-14">
                <td>
                  <span className="flex flex-col">
                    <span>{entry.title}</span>
                    <span className="text-sm text-base-content/60">
                      {entry.dow} · {entry.sessionTime}
                    </span>
                  </span>
                </td>
                <td className="tabular-nums">{entry.time}</td>
                <td>
                  <span className={markClass[entry.mark]}>{markLabel[entry.mark]}</span>
                </td>
                <td>
                  <JustCell row={entry} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AttendanceTable({
  rows,
  onOpen
}: {
  rows: RosterRow[]
  onOpen: (name: string) => void
}): React.JSX.Element {
  return (
    <div className="overflow-x-auto border-t border-base-content/10">
      <table className="table">
        <thead>
          <tr className="[&_th]:text-xs [&_th]:font-medium [&_th]:normal-case [&_th]:text-base-content/50">
            <th>Alumno</th>
            <th>Entrada</th>
            <th>Estado</th>
            <th>Justificante</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="h-14">
              <td>
                <div className="flex items-center gap-3">
                  <Avatar name={row.name} />
                  <button type="button" className="font-medium" onClick={() => onOpen(row.name)}>
                    {row.name}
                  </button>
                </div>
              </td>
              <td className="tabular-nums">{row.time}</td>
              <td>
                <span className={markClass[row.mark]}>{markLabel[row.mark]}</span>
              </td>
              <td>
                <JustCell row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CloseDialog(): React.JSX.Element | null {
  const open = usePanelStore((state) => state.confirmClose)
  const cancelClose = usePanelStore((state) => state.cancelClose)
  const closeSession = usePanelStore((state) => state.closeSession)
  if (!open) {
    return null
  }

  return (
    <div className="modal modal-open" role="dialog" aria-labelledby="close-title">
      <div className="modal-box">
        <h2 id="close-title" className="text-lg font-medium">
          Finalizar la lista
        </h2>
        <p className="py-3">Los pendientes pasarán a ausentes.</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={cancelClose}>
            Volver
          </button>
          <button type="button" className="btn btn-error" onClick={closeSession}>
            Finalizar
          </button>
        </div>
      </div>
    </div>
  )
}

function PhaseChip({ phase }: { phase: Phase }): React.JSX.Element {
  const label = phase === 'programada' ? 'Programada' : phase === 'abierta' ? 'Abierta' : 'Cerrada'
  const tone =
    phase === 'abierta' ? 'badge badge-soft badge-success' : 'badge badge-soft badge-neutral'
  return <span className={tone}>{label}</span>
}

function Stat({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-xl font-medium tabular-nums">{value}</p>
      <p className="text-sm text-base-content/60">{label}</p>
    </div>
  )
}

function Count({ value, label }: { value: number; label: string }): React.JSX.Element {
  return (
    <span className="min-w-16 text-right whitespace-nowrap">
      <span className="block text-sm font-medium tabular-nums">{value}</span>
      <span className="block text-xs text-base-content/50">{label}</span>
    </span>
  )
}

function Avatar({ name }: { name: string }): React.JSX.Element {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-medium">
      {initialsOf(name)}
    </span>
  )
}

function MarkControl({
  status,
  enabled,
  onPick
}: {
  status: Attendance | 'none'
  enabled: boolean
  onPick: (mark: Attendance) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  if (status === 'none') {
    return <span className="opacity-50">—</span>
  }
  if (!enabled) {
    return <span className={markClass[status]}>{markLabel[status]}</span>
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={markClass[status]}
        onClick={() => setOpen((value) => !value)}
      >
        {markLabel[status]}
      </button>
      {open ? (
        <ul className="menu rounded-box absolute z-10 mt-1 bg-base-100 p-2 shadow-sm">
          {(['presente', 'retraso', 'ausente'] as Attendance[]).map((mark) => (
            <li key={mark}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onPick(mark)
                }}
              >
                {markLabel[mark]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function JustCell({ row }: { row: RosterRow }): React.JSX.Element {
  if (row.just === 'none') {
    return <span />
  }
  const fileName = `justificante-${row.name.toLowerCase().replace(/ /g, '-')}.txt`
  return (
    <span className="flex items-center gap-2">
      <span className={justClass[row.just]}>{justLabel[row.just]}</span>
      {row.just === 'pend' || row.just === 'ok' ? (
        <a
          className="btn btn-ghost btn-xs"
          href={`data:text/plain,Justificante de ${row.name}`}
          download={fileName}
        >
          PDF
        </a>
      ) : null}
    </span>
  )
}

function RiskHint(): React.JSX.Element {
  return (
    <details className="dropdown dropdown-end">
      <summary className="badge badge-soft badge-warning cursor-pointer">Puede que falte</summary>
      <div className="dropdown-content card w-64 bg-base-100 shadow-sm">
        <div className="card-body gap-1 p-4">
          <p className="font-medium">Suele faltar los viernes</p>
          <p className="text-sm">
            Ha venido a 1 de los últimos 5 viernes. Quizá merece una conversación.
          </p>
          <p className="text-sm opacity-60">Es solo una pista, no cuenta en el registro</p>
        </div>
      </div>
    </details>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="flex flex-col">
        <span>{label}</span>
        <span className="text-sm opacity-60">{hint}</span>
      </span>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
