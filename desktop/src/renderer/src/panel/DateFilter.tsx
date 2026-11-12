import { useId, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { usePanelStore } from './panelStore'

const parseDate = (date: string): Date => new Date(`${date}T12:00:00`)
const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function rangeDates(range: DateRange | undefined): string[] {
  if (!range?.from) return []
  const dates: string[] = []
  const cursor = parseDate(dateKey(range.from))
  const end = parseDate(dateKey(range.to ?? range.from))
  while (cursor <= end) {
    dates.push(dateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function DateFilter({
  dates,
  available,
  onChange
}: {
  dates: string[]
  available: string[]
  onChange: (dates: string[]) => void
}): React.JSX.Element {
  const id = useId()
  const popover = useRef<HTMLDivElement>(null)
  const setAppliedMode = usePanelStore((state) => state.setStatsDateMode)
  const [draft, setDraft] = useState(dates)
  const [range, setRange] = useState<DateRange | undefined>()
  const ordered = [...dates].sort()
  const format = (date: string): string =>
    parseDate(date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
  const label = dates.length === 1 ? format(ordered[0]) : `${format(ordered[0])} – ${format(ordered.at(-1)!)}`
  const month = parseDate(available.at(-1)!)

  function preset(next: string[]): void {
    const nextRange = { from: parseDate(next[0]), to: parseDate(next.at(-1)!) }
    setDraft(rangeDates(nextRange))
    setRange(nextRange)
  }

  return (
    <div className="date-filter">
      <button
        type="button"
        popoverTarget={id}
        aria-haspopup="dialog"
        aria-label={`${label}. Elegir fechas`}
        className="badge badge-sm badge-soft date-trigger"
        style={{ anchorName: '--attendance-dates' }}
        onClick={() => preset(dates)}
      >
        <svg
          aria-hidden="true"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <rect x="3" y="5" width="18" height="16" rx="1" />
          <path d="M7 2v6m10-6v6M3 11h18" />
        </svg>
        <span>{label}</span>
      </button>
      <div
        id={id}
        ref={popover}
        popover="auto"
        role="dialog"
        aria-label="Elegir fechas"
        className="dropdown date-popover"
        style={{ positionAnchor: '--attendance-dates' }}
      >
        <div className="flex justify-center py-1">
          <DayPicker
            className="react-day-picker"
            locale={es}
            mode="range"
            hideNavigation
            disableNavigation
            startMonth={month}
            endMonth={month}
            defaultMonth={month}
            selected={range}
            onSelect={(next, day) => {
              const selection = range?.from && range?.to ? { from: day } : next
              setRange(selection)
              setDraft(rangeDates(selection))
            }}
          />
        </div>
        <div className="date-presets px-3 py-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => preset(available)}>
            Todo el historial
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => preset(available.slice(-3))}
          >
            Últimas 3 sesiones
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-3 py-3">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={!draft.length}
            onClick={() => {
              onChange([...draft].sort())
              setAppliedMode('range')
              popover.current?.hidePopover()
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
