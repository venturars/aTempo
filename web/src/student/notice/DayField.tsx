import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { calendarLocale } from '../../lang/format'
import { text, useText } from '../../lang/useText'
import { formatDay } from '../studentDate'

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function daysFromToday(day: Date): number {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  return Math.round((start.getTime() - startOfToday().getTime()) / 86_400_000)
}

// Ejemplos: «Hoy, mar 17 nov», «Mañana, mié 18 nov», «Jue 19 nov».
// Solo se llama al pintar, para que siga el idioma elegido.
function dayLabel(day: Date): string {
  const offset = daysFromToday(day)
  if (offset === 0) return text('notice.today', { day: formatDay(day, false) })
  if (offset === 1) return text('notice.tomorrow', { day: formatDay(day, false) })
  return formatDay(day)
}

export function DayField({
  id,
  day,
  onChange
}: {
  id: string
  day: Date
  onChange: (day: Date) => void
}): React.JSX.Element {
  const t = useText()
  const popoverId = useId()
  const popover = useRef<HTMLDivElement>(null)

  return (
    <>
      <button
        id={id}
        type="button"
        popoverTarget={popoverId}
        aria-haspopup="dialog"
        className="input field-button"
        style={{ anchorName: '--notice-day' }}
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 2v6m10-6v6M3 11h18" />
        </svg>
        <span className="field-button-value">{dayLabel(day)}</span>
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {createPortal(
        <div
          id={popoverId}
          ref={popover}
          popover="auto"
          role="dialog"
          aria-label={t('notice.chooseDay')}
          className="picker-panel"
          style={{
            position: 'fixed',
            positionAnchor: '--notice-day',
            margin: 0,
            inset: 'auto',
            top: 'calc(anchor(bottom) + 8px)',
            left: 'anchor(left)',
            width: 'max-content',
            maxWidth: 'calc(100vw - 1.5rem)'
          }}
        >
          <DayPicker
            className="react-day-picker"
            locale={calendarLocale()}
            mode="single"
            navLayout="around"
            selected={day}
            disabled={{ before: startOfToday() }}
            defaultMonth={day}
            onSelect={(next) => {
              if (!next) return
              onChange(next)
              popover.current?.hidePopover()
            }}
          />
        </div>,
        document.body
      )}
    </>
  )
}
