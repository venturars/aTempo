import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { checkedInByStudent } from '../api/attendanceRules'
import { getDemoControls } from '../api/client'
import { clockTime } from '../api/isoTime'
import { teacherDemoAccount } from '../login/teacherDemoAccount'
import { BackButton } from '../navigation/BackButton'
import { useSessionStore } from '../session/sessionStore'
import { isEditablePhase } from './apiValues'
import {
  todayArrival,
  todayMark,
  todayPhase,
  usePanelStore,
  type MarkChange,
  type PanelTab,
  type TodayStudent
} from './panelStore'
import { AccountMenu } from './AccountMenu'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { Avatar } from './avatar'
import { CorrectionReasonDialog } from './CorrectionReasonDialog'
import { JustificationAccess } from './JustificationAccess'
import { MarkControl } from './markControl'
import { CorrectionDialog, type CorrectionDraft } from './markCorrection'
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
  sessionCounts,
  sessionTitle,
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

// Nombre de la barra lateral. Si se abre la ruta del panel sin entrar, el de la cuenta de ejemplo.
function useTeacherName(): string {
  return useSessionStore((state) => state.name) ?? teacherDemoAccount.name
}

// Quién firma una corrección: solo un profesor con la sesión abierta. Sin sesión no se guarda.
function useSigner(): string | null {
  return useSessionStore((state) => (state.profile === 'teacher' ? state.name : null))
}

const noSignerText = 'Entra con tu cuenta de profesor para guardar el cambio.'
const notSavedText = 'No se ha podido guardar el cambio.'

export function PanelScreen(): React.JSX.Element {
  const tab = usePanelStore((state) => state.tab)
  const classId = usePanelStore((state) => state.classId)
  const studentName = usePanelStore((state) => state.studentName)
  const setTab = usePanelStore((state) => state.setTab)
  const goBack = usePanelStore((state) => state.goBack)
  const selected = classSessions.find((session) => session.id === classId) ?? null
  const title = pageTitle(tab, selected)
  const back = backLabel(tab, selected, studentName)
  const teacherName = useTeacherName()
  const signedIn = useSessionStore((state) => state.profile === 'teacher')
  // Con Auth0 la contraseña vive en Auth0: la de la demo no sirve para entrar.
  const [authConfigured, setAuthConfigured] = useState(true)
  useEffect(() => {
    void window.api.auth.isConfigured().then(setAuthConfigured, () => setAuthConfigured(true))
  }, [])
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const navigate = useNavigate()

  function logOut(): void {
    useSessionStore.getState().endSession()
    setTab(0)
    void navigate({ to: '/', replace: true })
  }

  return (
    <div className="teacher-panel grid min-h-screen grid-cols-1 bg-base-200 md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="flex flex-col border-base-content/4 bg-base-100 md:sticky md:top-0 md:h-screen md:border-r">
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent px-5 pt-8 pb-4 text-left text-xl font-semibold"
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
        <AccountMenu
          name={teacherName}
          onChangePassword={
            signedIn && !authConfigured
              ? () => {
                  setPasswordChanged(false)
                  setChangingPassword(true)
                }
              : undefined
          }
          onLogOut={logOut}
        />
      </aside>
      <main
        className={`mx-auto flex w-full min-w-0 justify-self-center flex-col gap-5 px-8 py-8 ${
          tab === 2 && studentName === null ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        <header className="flex flex-col gap-3">
          {back !== null ? <BackButton to={back} onClick={goBack} /> : null}
          {studentName !== null ? (
            <div className="flex items-center gap-3">
              <Avatar name={studentName} tall />
              <div>
                <h1 className="text-xl font-medium">{studentName}</h1>
                <p className="text-sm text-base-content/60">{course.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className={tab === 0 ? 'flex min-w-0 items-baseline gap-3' : 'min-w-0'}>
                <h1 className="text-xl font-medium">{title}</h1>
                {tab === 0 ? <p className="text-sm text-base-content/60">{dashboardDate}</p> : null}
              </div>
              {tab === 1 && selected !== null ? <JustificationAccess /> : null}
            </div>
          )}
        </header>
        {passwordChanged ? (
          <p className="text-sm text-success" role="status">
            Contraseña actualizada.
          </p>
        ) : null}
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
      {changingPassword && signedIn ? (
        <ChangePasswordDialog
          onClose={() => setChangingPassword(false)}
          onSaved={() => setPasswordChanged(true)}
        />
      ) : null}
      <CloseDialog />
      <CorrectionReasonDialog />
    </div>
  )
}

function pageTitle(tab: PanelTab, selected: ClassSession | null): string {
  if (tab === 1 && selected !== null) {
    return sessionTitle(selected.id)
  }
  if (tab === 0) {
    return dashboardHeading()
  }
  return tabs[tab]?.label ?? 'Dashboard'
}

// La pantalla a la que vuelve el botón de arriba. Las secciones de la barra lateral no tienen.
function backLabel(
  tab: PanelTab,
  selected: ClassSession | null,
  studentName: string | null
): string | null {
  if (studentName !== null) {
    if (tab === 1 && selected !== null) {
      return sessionTitle(selected.id)
    }
    return pageTitle(tab, null)
  }
  if (tab === 1 && selected !== null) {
    return 'Sesiones'
  }
  return null
}

function TodayView(): React.JSX.Element {
  const todayLoad = usePanelStore((state) => state.todayLoad)
  const todayError = usePanelStore((state) => state.todayError)
  const loadToday = usePanelStore((state) => state.loadToday)
  const resetToday = usePanelStore((state) => state.resetToday)
  const navigate = useNavigate()

  useEffect(() => {
    if (todayLoad === 'loading') {
      void loadToday()
    }
  }, [todayLoad, loadToday])

  useEffect(() => {
    if (todayLoad === 'signedOut') {
      resetToday()
      void navigate({ to: '/' })
    }
  }, [todayLoad, resetToday, navigate])

  const alert =
    todayError === null ? null : (
      <div role="alert" className="alert alert-error alert-soft">
        <span>{todayError}</span>
      </div>
    )

  if (todayLoad === 'loading' || todayLoad === 'signedOut') {
    return (
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body items-center">
          <span className="loading loading-spinner" aria-label="Cargando la clase de hoy" />
        </div>
      </section>
    )
  }
  if (todayLoad === 'denied') {
    return <>{alert}</>
  }
  if (todayLoad === 'failed') {
    return (
      <>
        {alert}
        <button type="button" className="btn w-fit" onClick={() => void loadToday()}>
          Reintentar
        </button>
      </>
    )
  }
  if (todayLoad === 'empty') {
    return (
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-sm text-base-content/60">No tienes clases hoy.</p>
        </div>
      </section>
    )
  }
  return (
    <>
      {alert}
      <TodayClass />
    </>
  )
}

function TodayClass(): React.JSX.Element {
  const session = usePanelStore((state) => state.session)
  const students = usePanelStore((state) => state.students)
  const records = usePanelStore((state) => state.records)
  const checkInCode = usePanelStore((state) => state.checkInCode)
  const busy = usePanelStore((state) => state.busy)
  const canSimulateArrival = usePanelStore((state) => state.canSimulateArrival)
  const simulateArrival = usePanelStore((state) => state.simulateArrival)
  const openSession = usePanelStore((state) => state.openSession)
  const askClose = usePanelStore((state) => state.askClose)
  const reopenSession = usePanelStore((state) => state.reopenSession)
  const canReopen = getDemoControls() !== null
  const refreshCheckInCode = usePanelStore((state) => state.refreshCheckInCode)
  const openStudent = usePanelStore((state) => state.openStudent)
  const requestMark = usePanelStore((state) => state.requestMark)
  const requestTime = usePanelStore((state) => state.requestTime)
  const changes = usePanelStore((state) => state.changes)
  const phase = todayPhase({ session })
  const roster = students
    .map((student) => ({
      ...student,
      mark: todayMark({ session, records }, student.studentId),
      time: todayArrival({ records }, student.studentId),
      checkedIn:
        records[student.studentId] !== undefined && checkedInByStudent(records[student.studentId])
    }))
    .sort((a, b) => compareByName(a.name, b.name))
  const present = roster.filter((row) => row.mark === 'presente').length
  const late = roster.filter((row) => row.mark === 'retraso').length
  const absent = roster.filter((row) => row.mark === 'ausente').length
  const courseName = session?.courseName ?? ''
  const courseTime =
    session === null ? '' : `${clockTime(session.startsAt)}–${clockTime(session.endsAt)}`

  return (
    <section className="card overflow-hidden bg-base-100 shadow-sm">
      <div className="card-body gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">{courseName}</h2>
            <p className="text-sm text-base-content/60">{courseTime}</p>
          </div>
          {phase === 'programada' ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void openSession()}
            >
              Abrir lista
            </button>
          ) : null}
          {phase === 'abierta' ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn"
                disabled={busy || !canSimulateArrival}
                onClick={() => void simulateArrival()}
              >
                Simular llegada
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={askClose}>
                Cerrar lista
              </button>
            </div>
          ) : null}
          {phase === 'cancelada' ? (
            <span className="badge badge-ghost">Clase cancelada</span>
          ) : null}
          {phase === 'cerrada' ? (
            <button
              type="button"
              className="btn"
              disabled={busy || !canReopen}
              onClick={() => void reopenSession()}
            >
              Volver a abrir
            </button>
          ) : null}
        </div>
        {phase === 'abierta' ? (
          <div className="flex justify-center py-2">
            <SessionQr
              code={checkInCode?.code ?? null}
              expiresAt={checkInCode?.expiresAt ?? null}
              onExpire={refreshCheckInCode}
            />
          </div>
        ) : null}
        {phase === 'cerrada' ? (
          <div className="grid grid-cols-3 gap-3">
            <StatWell value={String(present)} label="Presentes" />
            <StatWell value={String(late)} label="Tarde" />
            <StatWell value={String(absent)} label="Ausentes" />
          </div>
        ) : null}
      </div>
      <RosterTable
        roster={roster}
        phase={phase}
        openStudent={openStudent}
        requestMark={requestMark}
        requestTime={requestTime}
        changes={changes.filter((change) => change.sessionId === session?.id)}
        embedded
      />
    </section>
  )
}

function RosterTable({
  roster,
  phase,
  openStudent,
  requestMark,
  requestTime,
  changes,
  compact = false,
  embedded = false
}: {
  roster: (TodayStudent & { mark: Attendance | 'none'; time: string; checkedIn: boolean })[]
  phase: Phase
  openStudent: (name: string) => void
  requestMark: (studentId: string, mark: Attendance) => void
  requestTime: (studentId: string, time: string) => void
  changes: MarkChange[]
  compact?: boolean
  embedded?: boolean
}): React.JSX.Element {
  const editable = isEditablePhase(phase)
  const started = editable
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
              ? 'table table-roster table-spread min-w-[48rem]'
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
          {roster.map(({ studentId, name, mark: status, time, checkedIn }) => (
            <tr key={studentId}>
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
                    time={time}
                    enabled={editable && (status === 'presente' || status === 'retraso')}
                    onCommit={(value) => requestTime(studentId, value)}
                  />
                </td>
              ) : null}
              {started ? (
                <td>
                  <MarkControl
                    status={status}
                    arrivalAccepted={checkedIn}
                    person={name}
                    when={dashboardDate}
                    changes={changes.filter((change) => change.student === name)}
                    onPick={(mark) => requestMark(studentId, mark)}
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
  const correctSessionMark = usePanelStore((state) => state.correctSessionMark)
  const changes = usePanelStore((state) => state.changes)
  const signer = useSigner()
  const [draft, setDraft] = useState<CorrectionDraft | null>(null)

  if (selected === null) {
    return (
      <section className="card w-full overflow-hidden bg-base-100 shadow-sm">
        <table className="table table-spread">
          <thead>
            {/* Las tres cifras cuentan alumnos: «3 tarde» son tres alumnos, no el profesor. */}
            <tr>
              <th rowSpan={2}>Fecha</th>
              <th rowSpan={2}>Asistencia</th>
              <th colSpan={3} scope="colgroup">
                Alumnos
              </th>
            </tr>
            <tr>
              <th scope="col">Presentes</th>
              <th scope="col">Tarde</th>
              <th scope="col">Ausentes</th>
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
                      <SessionDate label={sessionTitle(session.id)} strong />
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
  const sessionId = selected.id
  const when = sessionTitle(sessionId)

  // Una sesión pasada está cerrada: cambiar un estado pide un motivo.
  function pick(name: string, mark: Attendance): void {
    if (rows.find((row) => row.name === name)?.mark === mark) {
      return
    }
    setDraft({
      person: name,
      when,
      to: mark,
      save: (reason) =>
        signer !== null && correctSessionMark(sessionId, name, mark, reason, signer),
      failText: signer === null ? noSignerText : notSavedText
    })
  }

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
        when={when}
        changes={changes.filter((change) => change.sessionId === sessionId)}
        onOpen={openStudent}
        onMark={pick}
      />
      <CorrectionDialog draft={draft} onDone={() => setDraft(null)} />
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
  changes,
  onOpen,
  onMark
}: {
  rows: RosterRow[]
  when: string
  changes: MarkChange[]
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
                  person={row.name}
                  when={when}
                  excuse={row.just}
                  changes={changes.filter((change) => change.student === row.name)}
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
          <button type="button" className="btn btn-error" onClick={() => void closeSession()}>
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
      {/* Ancho fijo: «Lun», «Mar» y «Mié» miden distinto y la fecha empezaría en otro sitio. */}
      <span className="inline-block w-7 text-base-content/60">{weekday}</span>{' '}
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
  // La hora con la que se abrió el campo: salir sin cambiarla no guarda nada.
  const opened = useRef('')

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
          // Escape quita el campo sin blur, así que el aviso de Escape anterior puede seguir puesto.
          skip.current = false
          opened.current = time === '—' ? '' : time
          setDraft(opened.current)
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
        // Mirar la hora y salir sin cambiarla no guarda nada: no deshace una marca hecha a mano.
        if (draft !== opened.current) {
          onCommit(draft)
        }
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
    if (mark === undefined) {
      return row
    }
    // Un ausente no tiene hora de entrada.
    return { ...row, mark, time: mark === 'ausente' ? '—' : row.time }
  })
}
