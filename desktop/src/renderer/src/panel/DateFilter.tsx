import { useId, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { usePanelStore } from './panelStore'
import { es } from 'react-day-picker/locale'

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
  const appliedMode = usePanelStore((state) => state.statsDateMode)
  const setAppliedMode = usePanelStore((state) => state.setStatsDateMode)
  const [mode, setMode] = useState<'range' | 'days'>(appliedMode)
  const [draft, setDraft] = useState(dates)
  const [range, setRange] = useState<DateRange | undefined>()
  const ordered = [...dates].sort()
  const format = (date: string): string =>
    parseDate(date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
  const label =
    appliedMode === 'days' && dates.length > 1
      ? `${dates.length} días seleccionados`
      : dates.length === 1
        ? format(ordered[0])
        : `${format(ordered[0])} – ${format(ordered.at(-1)!)}`

  function preset(next: string[]): void {
    const nextRange = { from: parseDate(next[0]), to: parseDate(next.at(-1)!) }
    setDraft(mode === 'range' ? rangeDates(nextRange) : next)
    setRange(nextRange)
  }

  return (
    <div className="date-filter">
      <button
        type="button"
        popoverTarget={id}
        aria-haspopup="dialog"
        aria-label={`${label}. Elegir fechas`}
        className="input input-sm date-trigger"
        style={{ anchorName: '--attendance-dates' }}
        onClick={() => {
          preset(dates)
          setMode(appliedMode)
        }}
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
        <svg
          aria-hidden="true"
          className="ml-auto"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="m5 8 5 5 5-5" />
        </svg>
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
        <div className="flex items-center justify-between gap-3 px-3 pt-3">
          <span className="text-sm font-semibold">Fechas</span>
        </div>
        <div className="join mx-3 mt-3 flex">
          {(
            [
              { value: 'range', label: 'Intervalo' },
              { value: 'days', label: 'Días sueltos' }
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`btn btn-sm join-item flex-1 ${mode === option.value ? 'btn-primary' : ''}`}
              aria-pressed={mode === option.value}
              onClick={() => setMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex justify-center py-1">
          {mode === 'range' ? (
            <DayPicker
              className="react-day-picker"
              locale={es}
              mode="range"
              defaultMonth={parseDate(available.at(-1)!)}
              selected={range}
              onSelect={(next, day) => {
                const selection = range?.from && range?.to ? { from: day } : next
                setRange(selection)
                setDraft(rangeDates(selection))
              }}
            />
          ) : (
            <DayPicker
              className="react-day-picker"
              locale={es}
              mode="multiple"
              defaultMonth={parseDate(available.at(-1)!)}
              selected={draft.map(parseDate)}
              onSelect={(next) => setDraft((next ?? []).map(dateKey))}
            />
          )}
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
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="text-xs text-base-content/70">
            {draft.length} {draft.length === 1 ? 'día seleccionado' : 'días seleccionados'}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={!draft.length}
            onClick={() => {
              onChange([...draft].sort())
              setAppliedMode(mode)
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
