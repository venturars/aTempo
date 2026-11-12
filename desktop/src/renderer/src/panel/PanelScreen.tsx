import { useEffect, useRef, useState } from 'react'
import { usePanelStore, type PanelTab } from './panelStore'
import { Avatar } from './avatar'
import { JustificationAccess } from './JustificationAccess'
import { MarkControl } from './markControl'
import { SettingsView } from './SettingsView'
import { SessionQr } from './sessionQr'
import { StatsView } from './StatsView'
import { StudentHistory } from './StudentHistory'
import { RiskHint } from './riskHint'
import {
  classSessions,
  compareByName,
  course,
  dashboardDate,
  dashboardHeading,
  rollStatus,
  rollTime,
  rosterNames,
  sessionCounts,
  studentHistory,
  studentSummary,
  type Attendance,
  type ClassSession,
  type Phase,
  type RosterRow
} from './roster'

const tabs: { id: PanelTab; label: string }[] = [
  { id: 0, label: 'Dashboard' },
  { id: 1, label: 'Sesiones' },
  { id: 2, label: 'Estadísticas' },
  { id: 3, label: 'Ajustes' }
]

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
    <div className="teacher-panel grid min-h-screen grid-cols-1 bg-base-200 md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="flex flex-col border-base-content/4 bg-base-100 md:sticky md:top-0 md:h-screen md:border-r">
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent px-5 pt-8 pb-4 text-left text-xl font-semibold tracking-tight"
          onClick={() => setTab(0)}
        >
          aTempo
        </button>
        <nav aria-label="Secciones">
          <ul className="menu w-full px-2">
            {tabs.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={
                    tab === item.id
                      ? 'cursor-pointer bg-primary/10 font-medium text-primary'
                      : 'cursor-pointer font-normal text-base-content/70'
                  }
                  aria-current={tab === item.id ? 'page' : undefined}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex items-stretch gap-3 border-t border-base-content/4 px-5 py-4">
          <Avatar name="Ventura Rodriguez" tall />
          <span className="flex flex-col">
            <span className="text-sm font-medium">Ventura Rodriguez</span>
            <span className="text-meta text-base-content/60">Profesor</span>
          </span>
        </div>
      </aside>
      <main
        className={`mx-auto flex w-full min-w-0 justify-self-center flex-col gap-5 px-8 py-8 ${
          tab === 2 && studentName === null ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {studentName !== null ? (
                <Breadcrumb
                  crumbs={crumbs}
                  onBack={goBack}
                  onRoot={() => setTab(tab)}
                  plainCurrent
                />
              ) : (
                <div className={tab === 0 ? 'flex items-baseline gap-3' : undefined}>
                  <Breadcrumb crumbs={crumbs} onBack={goBack} onRoot={() => setTab(tab)} />
                  {tab === 0 ? (
                    <p className="text-sm text-base-content/60">{dashboardDate}</p>
                  ) : null}
                </div>
              )}
            </div>
            {tab === 1 && selected !== null && studentName === null ? (
              <JustificationAccess />
            ) : null}
          </div>
          {studentName !== null ? (
            <div className="flex items-center gap-3">
              <Avatar name={studentName} tall />
              <div>
                <h1 className="text-xl font-medium tracking-tight">{studentName}</h1>
                <p className="text-sm text-base-content/60">{course.name}</p>
              </div>
            </div>
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
    return `${selected.id} 2026`
  }
  if (tab === 0) {
    return dashboardHeading()
  }
  return tabs[tab]?.label ?? 'Dashboard'
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
  if (studentName !== null && tab === 1 && selected !== null) {
    return [
      { label: 'Sesiones', action: 'root' },
      { label: `${selected.id} 2026`, action: 'back' },
      { label: studentName, action: 'current' }
    ]
  }
  if (studentName !== null) {
    return [
      { label: tab === 0 ? dashboardHeading() : (tabs[tab]?.label ?? 'Dashboard'), action: 'root' },
      { label: studentName, action: 'current' }
    ]
  }
  if (tab === 1 && selected !== null) {
    return [
      { label: 'Sesiones', action: 'root' },
      { label: title, action: 'current' }
    ]
  }
  return [{ label: title, action: 'current' }]
}

function Breadcrumb({
  crumbs,
  onBack,
  onRoot,
  plainCurrent = false
}: {
  crumbs: Crumb[]
  onBack: () => void
  onRoot: () => void
  plainCurrent?: boolean
}): React.JSX.Element {
  const trail = crumbs.some((crumb) => crumb.action !== 'current')
  if (!trail) {
    return <h1 className="text-xl font-medium tracking-tight">{crumbs[0]?.label}</h1>
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
              plainCurrent ? (
                <span className="text-sm font-medium">{crumb.label}</span>
              ) : (
                <h1 className="text-sm font-medium hover:no-underline">{crumb.label}</h1>
              )
            ) : (
              <button
                type="button"
                className="cursor-pointer text-sm text-base-content/55 hover:text-base-content"
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
  const setTime = usePanelStore((state) => state.setTime)
  const times = usePanelStore((state) => state.times)
  const statuses = rosterNames.map((_, index) => rollStatus(phase, marks, index))
  const present = statuses.filter((status) => status === 'presente').length
  const late = statuses.filter((status) => status === 'retraso').length
  const absent = statuses.filter((status) => status === 'ausente').length
  const roster = rosterNames
    .map((name, index) => ({ name, index, mark: statuses[index] ?? 'none' }))
    .sort((a, b) => compareByName(a.name, b.name))

  return (
    <section className="card overflow-hidden bg-base-100 shadow-sm">
      {phase === 'abierta' ? (
        <div className="card-body flex-row flex-wrap items-center gap-6">
          <SessionQr />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-lg font-medium">{course.name}</h2>
            <p className="text-sm text-base-content/60">{course.time}</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={askClose}>
            Cerrar lista
          </button>
        </div>
      ) : (
        <div className="card-body gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium">{course.name}</h2>
              <p className="text-sm text-base-content/60">{course.time}</p>
            </div>
            {phase === 'programada' ? (
              <button type="button" className="btn btn-primary" onClick={openSession}>
                Abrir lista
              </button>
            ) : null}
            {phase === 'cerrada' ? (
              <button type="button" className="btn" onClick={reopenSession}>
                Volver a abrir
              </button>
            ) : null}
          </div>
          {phase === 'cerrada' ? (
            <div className="grid grid-cols-3 gap-3">
              <StatWell value={String(present)} label="Presentes" />
              <StatWell value={String(late)} label="Tarde" />
              <StatWell value={String(absent)} label="Ausentes" />
            </div>
          ) : null}
        </div>
      )}
      <RosterTable
        roster={roster}
        phase={phase}
        times={times}
        openStudent={openStudent}
        setMark={setMark}
        setTime={setTime}
        embedded
      />
    </section>
  )
}

function RosterTable({
  roster,
  phase,
  times,
  openStudent,
  setMark,
  setTime,
  compact = false,
  embedded = false
}: {
  roster: { name: string; index: number; mark: Attendance | 'none' }[]
  phase: Phase
  times: Record<number, string>
  openStudent: (name: string) => void
  setMark: (index: number, mark: Attendance) => void
  setTime: (index: number, time: string) => void
  compact?: boolean
  embedded?: boolean
}): React.JSX.Element {
  const started = phase !== 'programada'
  return (
    <div
      className={
        embedded
          ? 'overflow-x-auto border-t border-base-content/4'
          : 'overflow-x-auto rounded-box bg-base-100 shadow-sm'
      }
    >
      <table
        className={
          compact
            ? 'table table-live'
            : started
              ? 'table table-roster table-spread'
              : 'table table-roster'
        }
      >
        {started ? (
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Entrada</th>
              <th>Estado</th>
            </tr>
          </thead>
        ) : null}
        <tbody>
          {roster.map(({ name, index, mark: status }) => (
            <tr key={name}>
              <td>
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    aria-label={name}
                    className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left font-medium text-inherit"
                    onClick={() => openStudent(name)}
                  >
                    <Avatar name={name} compact={compact} />
                    <span className="whitespace-nowrap">{name}</span>
                  </button>
                  {status === 'none' || status === 'pendiente' ? <RiskHint name={name} /> : null}
                </div>
              </td>
              {started ? (
                <td>
                  <TimeField
                    time={rollTime(status, index, times)}
                    enabled={phase === 'abierta'}
                    onCommit={(value) => setTime(index, value)}
                  />
                </td>
              ) : null}
              {started ? (
                <td>
                  <MarkControl
                    status={status}
                    enabled={phase === 'abierta'}
                    person={name}
                    when={dashboardDate}
                    onPick={(mark) => setMark(index, mark)}
                  />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ClassesView({ selected }: { selected: ClassSession | null }): React.JSX.Element {
  const openClass = usePanelStore((state) => state.openClass)
  const openStudent = usePanelStore((state) => state.openStudent)
  const sessionMarks = usePanelStore((state) => state.sessionMarks)
  const setSessionMark = usePanelStore((state) => state.setSessionMark)

  if (selected === null) {
    return (
      <section className="card w-full overflow-hidden bg-base-100 shadow-sm">
        <table className="table table-spread">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Asistencia</th>
              <th>Presentes</th>
              <th>Tarde</th>
              <th>Ausentes</th>
            </tr>
          </thead>
          <tbody>
            {classSessions.map((session) => {
              const rows = rowsWithMarks(session.rows, sessionMarks[session.id])
              const counts = session.rows === null ? null : sessionCounts(rows)
              const linked = !session.cancel && counts !== null
              const attendance = session.cancel
                ? 'Cancelada'
                : counts === null
                  ? '—'
                  : attendanceShare(counts)
              return (
                <tr
                  key={session.id}
                  className={linked ? 'cursor-pointer hover-grey [&_*]:cursor-pointer' : undefined}
                  onClick={linked ? () => openClass(session.id) : undefined}
                >
                  <td className="whitespace-nowrap">
                    <button
                      type="button"
                      className="cursor-pointer text-left disabled:cursor-default disabled:opacity-50"
                      disabled={!linked}
                      onClick={() => openClass(session.id)}
                    >
                      <SessionDate label={`${session.id} 2026`} strong />
                    </button>
                  </td>
                  <td className="tabular-nums text-base-content/50">{attendance}</td>
                  <td>
                    {counts === null ? (
                      <span className="text-base-content/50">—</span>
                    ) : (
                      <SessionCount value={counts.p} tone="muted" />
                    )}
                  </td>
                  <td>
                    {counts === null ? '—' : <SessionCount value={counts.r} tone="warning" />}
                  </td>
                  <td>{counts === null ? '—' : <SessionCount value={counts.a} tone="error" />}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    )
  }

  const rows = rowsWithMarks(selected.rows, sessionMarks[selected.id]).sort((a, b) =>
    compareByName(a.name, b.name)
  )
  const counts = sessionCounts(rows)

  return (
    <section className="card overflow-hidden bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">{course.name}</h2>
          <p className="text-sm text-base-content/60">{selected.time}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatWell value={String(counts.p)} label="Presentes" />
          <StatWell value={String(counts.r)} label="Tarde" />
          <StatWell value={String(counts.a)} label="Ausentes" />
        </div>
      </div>
      <AttendanceTable
        rows={rows}
        when={`${selected.id} 2026`}
        onOpen={openStudent}
        onMark={(name, mark) => setSessionMark(selected.id, name, mark)}
      />
    </section>
  )
}

type SortKey = 'name' | 'time' | 'mark'
type Sort = { key: SortKey; dir: 1 | -1 }

const markOrder: Record<Attendance, number> = {
  ausente: 0,
  retraso: 1,
  pendiente: 2,
  presente: 3
}

function compareRows(a: RosterRow, b: RosterRow, sort: Sort): number {
  const by =
    sort.key === 'name'
      ? compareByName(a.name, b.name)
      : sort.key === 'time'
        ? (a.time === '—' ? '99:99' : a.time).localeCompare(b.time === '—' ? '99:99' : b.time)
        : markOrder[a.mark] - markOrder[b.mark]
  if (by !== 0) {
    return by * sort.dir
  }
  return compareByName(a.name, b.name)
}

function SortHeader({
  label,
  column,
  sort,
  onChoose
}: {
  label: string
  column: SortKey
  sort: Sort
  onChoose: (key: SortKey) => void
}): React.JSX.Element {
  const on = sort.key === column
  return (
    <th aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className="group inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-inherit text-inherit"
        onClick={() => onChoose(column)}
      >
        {label}
        <svg
          viewBox="0 0 10 10"
          className={`size-2.5 ${on ? 'opacity-70' : 'opacity-25 group-hover:opacity-50'}`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d={on && sort.dir === 1 ? 'M2 6.5 5 3.5 8 6.5' : 'M2 3.5 5 6.5 8 3.5'}
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </th>
  )
}

function StudentFile({ name }: { name: string }): React.JSX.Element {
  const sessionMarks = usePanelStore((state) => state.sessionMarks)
  const summary = studentSummary(name, sessionMarks)
  const history = studentHistory(name, sessionMarks)

  return (
    <section className="card overflow-hidden bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="grid grid-cols-3 gap-3">
          <StatWell value={summary.pct} label="Asistencia" />
          <StatWell value={String(summary.late)} label="Tarde" muteZero={false} />
          <StatWell value={String(summary.abs)} label="Ausencias" muteZero={false} />
        </div>
      </div>
      <div className="border-t border-base-content/4 px-5 py-2">
        <StudentHistory entries={history} />
      </div>
    </section>
  )
}

function AttendanceTable({
  rows,
  when,
  onOpen,
  onMark
}: {
  rows: RosterRow[]
  when: string
  onOpen: (name: string) => void
  onMark: (name: string, mark: Attendance) => void
}): React.JSX.Element {
  const [sort, setSort] = useState<Sort>({ key: 'name', dir: 1 })
  const ordered = [...rows].sort((a, b) => compareRows(a, b, sort))

  function choose(key: SortKey): void {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: 1 }
    )
  }

  return (
    <div className="overflow-x-auto border-t border-base-content/4">
      <table className="table table-roster table-spread">
        <thead>
          <tr>
            <SortHeader label="Alumno" column="name" sort={sort} onChoose={choose} />
            <SortHeader label="Entrada" column="time" sort={sort} onChoose={choose} />
            <SortHeader label="Estado" column="mark" sort={sort} onChoose={choose} />
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.name}>
              <td>
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    aria-label={row.name}
                    className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left font-medium text-inherit"
                    onClick={() => onOpen(row.name)}
                  >
                    <Avatar name={row.name} />
                    <span className="whitespace-nowrap">{row.name}</span>
                  </button>
                </div>
              </td>
              <td className="tabular-nums text-base-content/50">{row.time}</td>
              <td>
                <MarkControl
                  status={row.mark}
                  enabled
                  person={row.name}
                  when={when}
                  excuse={row.just}
                  onPick={(mark) => onMark(row.name, mark)}
                />
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
  const backRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    backRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        cancelClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, cancelClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          cancelClose()
        }
      }}
    >
      <div className="modal-box popover-in">
        <h2 id="close-title" className="text-lg font-medium">
          Cerrar la lista
        </h2>
        <p className="py-3">Los pendientes pasarán a ausentes.</p>
        <div className="modal-action">
          <button ref={backRef} type="button" className="btn" onClick={cancelClose}>
            Volver
          </button>
          <button type="button" className="btn btn-error" onClick={closeSession}>
            Cerrar lista
          </button>
        </div>
      </div>
    </div>
  )
}

function StatWell({
  value,
  label,
  tone = 'plain',
  card = false,
  muteZero = true
}: {
  value: string
  label: string
  tone?: 'plain' | 'warning' | 'error'
  card?: boolean
  muteZero?: boolean
}): React.JSX.Element {
  const amount = Number(value.replace('%', '').trim())
  const quiet = muteZero && amount === 0
  const color = quiet
    ? 'text-base-content/30'
    : tone === 'warning'
      ? 'text-warning'
      : tone === 'error'
        ? 'font-semibold text-error'
        : 'text-base-content'

  return (
    <div
      className={
        card ? 'rounded-box bg-base-100 px-4 py-3 shadow-sm' : 'rounded-box bg-base-200 px-3 py-2'
      }
    >
      <p className={`text-base font-medium tabular-nums ${color}`}>{value}</p>
      <p className="text-xs text-base-content/60">{label}</p>
    </div>
  )
}

function SessionDate({
  label,
  strong = false
}: {
  label: string
  strong?: boolean
}): React.JSX.Element {
  const [weekday, ...rest] = label.split(' ')
  return (
    <>
      <span className="text-base-content/60">{weekday}</span>{' '}
      <span className={strong ? 'font-medium' : undefined}>{rest.join(' ')}</span>
    </>
  )
}

function attendanceShare(counts: { p: number; r: number; a: number }): string {
  const total = counts.p + counts.r + counts.a
  if (total === 0) {
    return '—'
  }
  return `${Math.round(((counts.p + counts.r) / total) * 100)} %`
}

function SessionCount({
  value,
  tone
}: {
  value: number
  tone: 'plain' | 'muted' | 'warning' | 'error'
}): React.JSX.Element {
  const color =
    value === 0
      ? 'text-base-content/30'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'error'
          ? 'font-semibold text-error'
          : tone === 'muted'
            ? 'text-base-content/50'
            : 'text-base-content'
  return <span className={`tabular-nums ${color}`}>{value}</span>
}

function TimeField({
  time,
  enabled,
  onCommit
}: {
  time: string
  enabled: boolean
  onCommit: (value: string) => void
}): React.JSX.Element {
  const [draft, setDraft] = useState<string | null>(null)
  const skip = useRef(false)

  if (!enabled) {
    return <span className="tabular-nums text-base-content/50">{time}</span>
  }
  if (draft === null) {
    return (
      <button
        type="button"
        className="cursor-pointer tabular-nums text-base-content/50 hover:text-base-content"
        onClick={(event) => {
          event.stopPropagation()
          setDraft(time === '—' ? '' : time)
        }}
      >
        {time}
      </button>
    )
  }

  return (
    <input
      type="time"
      className="time-field"
      value={draft}
      autoFocus
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (skip.current) {
          skip.current = false
          return
        }
        onCommit(draft)
        setDraft(null)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          skip.current = true
          setDraft(null)
        }
      }}
    />
  )
}

function rowsWithMarks(
  rows: RosterRow[] | null,
  saved: Record<string, Attendance> | undefined
): RosterRow[] {
  return (rows ?? []).map((row) => {
    const mark = saved?.[row.name]
    return mark === undefined ? row : { ...row, mark }
  })
}
