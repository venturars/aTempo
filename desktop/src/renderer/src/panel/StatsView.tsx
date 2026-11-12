import { useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { MobileAttendance } from './MobileAttendance'
import { AttendanceStatus } from './AttendanceStatus'
import { Avatar } from './avatar'
import { DateFilter } from './DateFilter'
import { RecognitionAward } from './RecognitionAward'
import { usePanelStore } from './panelStore'
import {
  classSessions,
  compareStudentNames,
  course,
  rosterNames,
  type RosterRow,
  type ClassSession
} from './roster'

const labels = {
  presente: 'Presente',
  retraso: 'Tarde',
  ausente: 'Ausente',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  'sin-registro': 'Sin registro'
}

const badges = {
  presente: 'badge badge-sm badge-soft badge-success',
  retraso: 'badge badge-sm badge-soft badge-warning',
  ausente: 'badge badge-sm badge-soft badge-error',
  pendiente: 'badge badge-sm badge-soft',
  cancelada: 'badge badge-sm badge-soft',
  'sin-registro': 'badge badge-sm badge-soft'
}

function dateLabel(session: ClassSession): string {
  return `${session.id.split(' ')[1]} nov 2026`
}

type Selection = { name: string; session: ClassSession; row: RosterRow | undefined }

export function StatsView(): React.JSX.Element {
  const sessionMarks = usePanelStore((state) => state.sessionMarks)
  const sessions = [...classSessions].reverse().map((session) => {
    if (session.rows === null) {
      return session
    }
    return {
      ...session,
      rows: session.rows.map((row) => {
        const saved = sessionMarks[session.id]?.[row.name]
        return saved === undefined ? row : { ...row, mark: saved }
      })
    }
  })
  const sessionDate = (session: ClassSession): string =>
    `2026-11-${session.id.split(' ')[1].padStart(2, '0')}`
  const available = sessions.map(sessionDate)
  const savedDates = usePanelStore((state) => state.statsDates)
  const setDates = usePanelStore((state) => state.setStatsDates)
  const savedScroll = usePanelStore((state) => state.statsScroll)
  const setScroll = usePanelStore((state) => state.setStatsScroll)
  const dates = savedDates ?? available
  const [overflow, setOverflow] = useState({ left: false, right: false })
  const [focusedCell, setFocusedCell] = useState(0)
  const scroll = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = scroll.current
    if (!element) return
    element.scrollLeft = savedScroll
    const update = (): void =>
      setOverflow({
        left: element.scrollLeft > 1,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1
      })
    update()
    element.addEventListener('scroll', update)
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [savedScroll, dates.length])
  const [selected, setSelected] = useState<Selection | null>(null)
  const [timeTip, setTimeTip] = useState<{ text: string; top: number; left: number } | null>(null)
  const openStudent = usePanelStore((state) => state.openStudent)
  const visible = sessions.filter((session) => dates.includes(sessionDate(session)))
  const held = visible.filter((session) => session.rows !== null && !session.cancel)
  const records = [...rosterNames].sort(compareStudentNames).map((name) => {
    const rows = held.flatMap((session) => {
      const row = session.rows?.find((item) => item.name === name)
      return row ? [row] : []
    })
    return {
      name,
      attended: rows.filter((row) => row.mark === 'presente' || row.mark === 'retraso').length,
      punctual: rows.filter((row) => row.mark === 'presente').length,
      absent: rows.filter((row) => row.mark === 'ausente').length,
      late: rows.filter((row) => row.mark === 'retraso').length,
      complete: held.length > 0 && rows.length === held.length
    }
  })
  const awards = [
    {
      title: 'Never miss a day',
      icon: 'trophy' as const,
      description: 'Asistencia completa',
      names: records
        .filter((person) => person.complete && person.attended === held.length)
        .map((person) => person.name)
    },
    {
      title: 'Always on time',
      icon: 'clock' as const,
      description: 'Siempre puntual',
      names: records
        .filter(
          (person) => person.complete && person.attended > 0 && person.punctual === person.attended
        )
        .map((person) => person.name)
    }
  ]

  function moveCellFocus(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const columns = visible.length
    const last = records.length * columns - 1
    const rowStart = Math.floor(index / columns) * columns
    let next: number
    if (event.key === 'ArrowRight') next = Math.min(index + 1, rowStart + columns - 1)
    else if (event.key === 'ArrowLeft') next = Math.max(index - 1, rowStart)
    else if (event.key === 'ArrowDown') next = Math.min(index + columns, last)
    else if (event.key === 'ArrowUp') next = Math.max(index - columns, 0)
    else if (event.key === 'Home') next = event.ctrlKey ? 0 : rowStart
    else if (event.key === 'End') next = event.ctrlKey ? last : rowStart + columns - 1
    else return
    event.preventDefault()
    setFocusedCell(next)
    scroll.current?.querySelectorAll<HTMLButtonElement>('.attendance-cell')[next]?.focus()
  }

  function showTime(event: MouseEvent<HTMLButtonElement>, time: string): void {
    const rect = event.currentTarget.getBoundingClientRect()
    setTimeTip({ text: time, top: rect.top - 6, left: rect.left + rect.width / 2 })
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="flex min-w-0 flex-col gap-5">
      <section className="card overflow-hidden bg-base-100 shadow-sm">
          <div className="card-body gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-medium">{course.name}</h2>
              <DateFilter
                dates={dates}
                available={available}
                onChange={(next) => {
                  setDates(next)
                  setFocusedCell(0)
                  setSelected(null)
                }}
              />
            </div>
            <div className="desktop-attendance-legend flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {(['presente', 'retraso', 'ausente', 'cancelada'] as const).map((mark) => (
                <span key={mark} className="inline-flex items-center gap-2">
                  <AttendanceStatus mark={mark} />
                  {labels[mark]}
                </span>
              ))}
            </div>
          </div>
          {held.length > 0 ? (
            <MobileAttendance
              key={dates.join(',')}
              students={records}
              sessions={held}
              onOpenStudent={openStudent}
            />
          ) : null}
          {visible.length > 0 ? (
          <div className="attendance-grid desktop-attendance-grid border-t border-base-content/4">
          <div
            className="attendance-scroll"
            ref={scroll}
            role="region"
            aria-label="Asistencia por fecha. Desplázate en vertical para ver más alumnos y en horizontal para ver más sesiones."
            tabIndex={0}
            onScroll={(event) => setScroll(event.currentTarget.scrollLeft)}
          >
            <table className="table attendance-table">
              <caption className="sr-only">
                Asistencia de todos los alumnos por sesión. Los retrasos cuentan como asistencia;
                las sesiones canceladas no cuentan. Usa las flechas para recorrer los estados y
                Enter para ver el detalle.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="attendance-name">
                    Alumno
                  </th>
                  {visible.map((session) => (
                    <th
                      key={session.id}
                      scope="col"
                      className={`attendance-date ${session.cancel ? 'cancelled-column' : ''}`}
                    >
                      <span className="block font-medium normal-case tracking-normal">
                        {session.id.split(' ')[0]}
                      </span>
                      <span className="block font-medium normal-case tracking-normal tabular-nums text-base-content">
                        {session.id.split(' ')[1]}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="attendance-total">
                    Asistencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((person, personIndex) => (
                  <tr key={person.name} className="attendance-row">
                    <th scope="row" className="attendance-name">
                      <button
                        type="button"
                        aria-label={person.name}
                        className="block w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm font-medium normal-case tracking-normal text-base-content"
                        onClick={() => openStudent(person.name)}
                      >
                        {person.name}
                      </button>
                    </th>
                    {visible.map((session, sessionIndex) => {
                      const row = session.rows?.find((item) => item.name === person.name)
                      const mark = session.cancel ? 'cancelada' : (row?.mark ?? 'sin-registro')
                      const status = session.cancel
                        ? 'Cancelada'
                        : row
                          ? labels[row.mark]
                          : 'Sin registro'
                      const title = `${person.name} · ${dateLabel(session)} · ${status}${row && row.time !== '—' ? ` · ${row.time}` : ''}`
                      const time = row && row.time !== '—' ? row.time : 'Sin entrada'
                      return (
                        <td
                          key={session.id}
                          className={`attendance-day ${session.cancel ? 'cancelled-column' : ''}`}
                        >
                          <button
                            type="button"
                            className="attendance-cell"
                            aria-label={title}
                            tabIndex={
                              focusedCell === personIndex * visible.length + sessionIndex ? 0 : -1
                            }
                            onKeyDown={(event) =>
                              moveCellFocus(event, personIndex * visible.length + sessionIndex)
                            }
                            onFocus={() =>
                              setFocusedCell(personIndex * visible.length + sessionIndex)
                            }
                            onMouseEnter={(event) => showTime(event, time)}
                            onMouseLeave={() => setTimeTip(null)}
                            onClick={() => setSelected({ name: person.name, session, row })}
                          >
                            <AttendanceStatus mark={mark} />
                          </button>
                        </td>
                      )
                    })}
                    <td className="attendance-total tabular-nums text-base-content/50">
                      <span>
                        {held.length
                          ? `${Math.round((person.attended / held.length) * 100)} %`
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {overflow.left || overflow.right ? (
            <div className="flex justify-end gap-2 border-t border-base-content/4 px-4 py-3">
              <button
                type="button"
                className="btn btn-sm"
                aria-label="Ver sesiones anteriores"
                disabled={!overflow.left}
                onClick={() => scroll.current?.scrollBy({ left: -168 })}
              >
                ←
              </button>
              <button
                type="button"
                className="btn btn-sm"
                aria-label="Ver sesiones siguientes"
                disabled={!overflow.right}
                onClick={() => scroll.current?.scrollBy({ left: 168 })}
              >
                →
              </button>
            </div>
          ) : null}
          </div>
          ) : null}
          {!held.length ? (
            <p role="status" className="border-t border-base-content/4 px-5 py-4 text-sm text-base-content/60">
              No hay clases celebradas en estas fechas. Elige otro intervalo.
            </p>
          ) : null}
        </section>
      {selected ? (
        <div
          className="flex items-center justify-between gap-4 rounded-box bg-base-100 px-5 py-3 shadow-sm"
          role="status"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={selected.name} />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {selected.name} · {dateLabel(selected.session)}
              </p>
              <p className="text-sm text-base-content/60">
                {selected.row && selected.row.time !== '—' ? `Entrada ${selected.row.time}` : 'Sin entrada'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={
                badges[
                  selected.session.cancel
                    ? 'cancelada'
                    : (selected.row?.mark ?? 'sin-registro')
                ]
              }
            >
              {selected.session.cancel
                ? 'Cancelada'
                : selected.row
                  ? labels[selected.row.mark]
                  : 'Sin registro'}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      </div>
      <section aria-labelledby="awards-title" className="flex flex-col gap-4">
        <h2 id="awards-title" className="text-lg font-medium">
          Reconocimientos
        </h2>
        <div className="grid gap-4">
          {awards.map((award) => (
            <RecognitionAward
              key={award.title}
              title={award.title}
              kind={award.icon}
              description={award.description}
              names={award.names}
              onSelect={openStudent}
            />
          ))}
        </div>
      </section>
      {timeTip !== null
        ? createPortal(
            <span
              className="tip popover-in pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full px-2.5 py-1 text-sm font-medium tabular-nums"
              style={{ top: timeTip.top, left: timeTip.left }}
            >
              {timeTip.text}
            </span>,
            document.body
          )
        : null}
    </div>
  )
}
