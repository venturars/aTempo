import { StudentHistory } from './StudentHistory'
import { JustificationAccess } from './JustificationAccess'
import { StatsView } from './StatsView'
import { SettingsView } from './SettingsView'
import { useEffect, useRef, useState } from 'react'
import { usePanelStore, type PanelTab } from './panelStore'
import {
  classSessions,
  compareStudentNames,
  sessionDateLabel,
  course,
  initialsOf,
  rollStatus,
  rollTime,
  rosterNames,
  sessionCounts,
  studentHistory,
  studentSummary,
  todayLabel,
  type Attendance,
  type ClassSession,
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
    <div className="panel-prototype grid min-h-screen grid-cols-1 bg-base-200 md:grid-cols-[13rem_1fr]">
      <aside className="flex flex-col border-base-content/10 bg-base-100 md:sticky md:top-0 md:h-screen md:border-r">
        <div className="panel-brand">
          <span aria-hidden="true" className="panel-brand-symbol">
            a
          </span>
          <span>aTempo</span>
        </div>
        <nav className="panel-navigation px-3" aria-label="Secciones">
          <ul className="menu menu-sm w-full gap-1 p-0">
            {tabs.map((item) => (
              <li key={item.id} className={item.id === 3 ? 'panel-settings-link' : ''}>
                <button
                  type="button"
                  className={tab === item.id ? 'menu-active font-medium' : 'text-base-content/80'}
                  aria-current={tab === item.id ? 'page' : undefined}
                  onClick={() => setTab(item.id)}
                >
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.id === 0 ? (
                      <path d="m3 10 9-7 9 7v10H3V10Zm6 10v-7h6v7" />
                    ) : item.id === 1 ? (
                      <>
                        <rect x="3" y="5" width="18" height="16" rx="1" />
                        <path d="M7 2v6m10-6v6M3 11h18" />
                      </>
                    ) : item.id === 2 ? (
                      <>
                        <path d="M4 3v17h17M9 16v-4m5 4V8m5 8V5" />
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="3" />
                        <path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3H9Z" />
                      </>
                    )}
                  </svg>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
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
      <main className="panel-main flex min-w-0 w-full flex-col">
        <header className="panel-page-heading flex w-full flex-col gap-1">
          <div className="panel-heading-row">
            <Breadcrumb crumbs={crumbs} onBack={goBack} onRoot={() => setTab(tab)} />
            <JustificationAccess />
          </div>
          {tab === 0 && studentName === null ? (
            <p className="text-sm opacity-60">{todayLabel}</p>
          ) : null}
        </header>
        <div className="panel-content">
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
        </div>
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
    return sessionDateLabel(selected.id)
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
            {rosterNames
              .map((name, index) => ({ name, index }))
              .sort((a, b) => compareStudentNames(a.name, b.name))
              .map(({ name, index }) => {
                const status = statuses[index] ?? 'none'
                return (
                  <tr key={name} className="panel-data-row">
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
                  aria-disabled={session.cancel}
                  onClick={() => {
                    if (!session.cancel) openClass(session.id)
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{sessionDateLabel(session.id)}</span>
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

function StudentFile({ name }: { name: string }): React.JSX.Element {
  const summary = studentSummary(name)
  const history = studentHistory(name)

  return (
    <div className="student-profile flex flex-col gap-4">
      <section className="student-profile-summary bg-base-100">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-base-200 text-sm font-medium">
            {summary.initials}
          </span>
          <span className="text-sm text-base-content/60">
            {summary.email} · {course.name}
          </span>
        </div>
        <div className="student-profile-metrics">
          <Stat value={summary.pct} label="Asistencia" />
          <Stat value={String(summary.late)} label="Tarde" />
          <Stat value={String(summary.abs)} label="Ausencias" />
          <Stat value={String(summary.streak)} label="Sesiones seguidas" />
        </div>
      </section>
      {name === 'Pablo Jiménez' ? (
        <p className="student-profile-observation">
          Asistencia los viernes:{' '}
          {history.filter((entry) => entry.dow === 'Viernes' && entry.mark !== 'ausente').length} de{' '}
          {history.filter((entry) => entry.dow === 'Viernes').length} sesiones.
        </p>
      ) : null}
      <StudentHistory entries={history} />
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
          {[...rows]
            .sort((a, b) => compareStudentNames(a.name, b.name))
            .map((row) => (
              <tr key={row.name} className="panel-data-row">
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
  const dialog = useRef<HTMLDialogElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current
    element?.showModal()
    cancelButton.current?.focus()
    return () => {
      element?.close()
      previous?.focus()
    }
  }, [open])
  if (!open) return null

  return (
    <dialog ref={dialog} className="modal" aria-labelledby="close-title" onCancel={cancelClose}>
      <div className="modal-box">
        <h2 id="close-title" className="text-lg font-medium">
          Finalizar la lista
        </h2>
        <p className="py-3">Los pendientes pasarán a ausentes.</p>
        <div className="modal-action">
          <button type="button" ref={cancelButton} className="btn" onClick={cancelClose}>
            Volver
          </button>
          <button type="button" className="btn btn-error" onClick={closeSession}>
            Finalizar
          </button>
        </div>
      </div>
    </dialog>
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
      <p className="text-base tabular-nums">{value}</p>
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
  const openStudent = usePanelStore((state) => state.openStudent)
  if (row.just === 'none') return <span />
  if (row.just === 'no')
    return <span className="text-sm text-base-content/70">Sin justificante</span>
  return (
    <button
      type="button"
      className="student-session-document"
      onClick={() => openStudent(row.name)}
    >
      Justificante {row.just === 'ok' ? 'aprobado' : 'pendiente'}
    </button>
  )
}
