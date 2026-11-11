import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { MobileAttendance } from './MobileAttendance'
import { AttendanceStatus } from './AttendanceStatus'
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
  retraso: 'Retraso',
  ausente: 'Ausencia',
  pendiente: 'Pendiente'
}

function dateLabel(session: ClassSession): string {
  return `${session.id.split(' ')[1]} nov 2026`
}

type Selection = { name: string; session: ClassSession; row: RosterRow | undefined }

export function StatsView(): React.JSX.Element {
  const sessions = [...classSessions].reverse()
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
      description: 'Asistencia completa en el período',
      names: records
        .filter((person) => person.complete && person.attended === held.length)
        .map((person) => person.name)
    },
    {
      title: 'Always on time',
      icon: 'clock' as const,
      description: 'Puntual en todas sus asistencias',
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

  return (
    <div className="attendance-stats flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">{course.name}</h2>
          <p className="text-sm text-base-content/60">
            {held.length} {held.length === 1 ? 'sesión' : 'sesiones'}
          </p>
        </div>
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
      <div className="attendance-legend desktop-attendance-legend flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {(['presente', 'retraso', 'ausente', 'cancelada'] as const).map((mark) => (
          <span key={mark} className="inline-flex items-center gap-2">
            <AttendanceStatus mark={mark} />
            {mark === 'cancelada' ? 'Cancelada' : labels[mark]}
          </span>
        ))}
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
        <div className="attendance-grid desktop-attendance-grid card bg-base-100">
          <div
            className="attendance-scroll"
            ref={scroll}
            role="region"
            aria-label="Asistencia por fecha. Desplázate horizontalmente para ver más sesiones."
            tabIndex={0}
            onScroll={(event) => setScroll(event.currentTarget.scrollLeft)}
          >
            <table
              className="table table-sm attendance-table"
              style={{
                width: '100%',
                minWidth: 144 + visible.length * 56 + 88
              }}
            >
              <caption className="sr-only">
                Asistencia de todos los alumnos por sesión. Los retrasos cuentan como asistencia;
                las sesiones canceladas no cuentan. Usa las flechas para recorrer los estados y
                Enter para ver el detalle.
              </caption>
              <colgroup>
                <col />
                {visible.map((session) => (
                  <col key={session.id} style={{ width: '56px' }} />
                ))}
                <col style={{ width: 'var(--attendance-total-width)' }} />
              </colgroup>
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
                      <span className="block text-[11px] text-base-content/60">
                        {session.id.split(' ')[0]}
                      </span>
                      <span className="block text-base font-medium tabular-nums">
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
                        className="rounded-[2px] text-left hover:text-primary"
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
                      return (
                        <td
                          key={session.id}
                          className={`attendance-day ${session.cancel ? 'cancelled-column' : ''}`}
                        >
                          <button
                            type="button"
                            className="attendance-cell"
                            aria-label={title}
                            title={title}
                            tabIndex={
                              focusedCell === personIndex * visible.length + sessionIndex ? 0 : -1
                            }
                            onKeyDown={(event) =>
                              moveCellFocus(event, personIndex * visible.length + sessionIndex)
                            }
                            onFocus={() =>
                              setFocusedCell(personIndex * visible.length + sessionIndex)
                            }
                            onClick={() => setSelected({ name: person.name, session, row })}
                          >
                            <AttendanceStatus mark={mark} />
                          </button>
                        </td>
                      )
                    })}
                    <td className="attendance-total tabular-nums">
                      <span>
                        {held.length
                          ? `${Math.round((person.attended / held.length) * 100)}%`
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {overflow.left || overflow.right ? (
            <div className="attendance-scroll-controls">
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
        <p role="status" className="text-sm">
          No hay clases celebradas en estas fechas. Elige otro intervalo.
        </p>
      ) : null}
      {selected ? (
        <div
          className="flex items-center justify-between gap-4 rounded-[2px] bg-base-100 px-4 py-3"
          role="status"
        >
          <div>
            <p className="text-sm font-medium">
              {selected.name} · {dateLabel(selected.session)}
            </p>
            <p className="text-sm text-base-content/70">
              {selected.session.cancel
                ? 'Clase cancelada'
                : selected.row
                  ? `${labels[selected.row.mark]}${selected.row.time !== '—' ? ` · Entrada ${selected.row.time}` : ''}`
                  : 'Sin registro'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost rounded-[2px]"
            onClick={() => setSelected(null)}
          >
            Cerrar
          </button>
        </div>
      ) : null}
      <section aria-labelledby="awards-title" className="recognition-section">
        <h2 id="awards-title" className="mb-4 text-base font-semibold">
          Reconocimientos
        </h2>
        <div className="recognition-grid">
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
    </div>
  )
}
