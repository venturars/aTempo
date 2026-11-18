import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

// Si no hay hora, la lista abre en la hora de la clase.
const firstVisibleHour = '09'

function timeParts(value: string): { hour: string; minute: string } {
  const [hour = '', minute = ''] = value.split(':')
  return { hour, minute }
}

// Lleva la opción elegida al centro de su columna al abrir el panel.
function scrollToPressed(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLElement>('.time-column').forEach((column) => {
    const target =
      column.querySelector<HTMLElement>('[aria-pressed="true"]') ??
      column.querySelector<HTMLElement>('[data-start]')
    if (target === null) {
      column.scrollTop = 0
      return
    }
    column.scrollTop = target.offsetTop - column.clientHeight / 2 + target.clientHeight / 2
  })
}

// Un campo de hora que se escribe (0917) o se elige en un panel del sistema.
export function TimeField({
  id,
  value,
  invalid,
  onChange
}: {
  id: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}): React.JSX.Element {
  const popoverId = useId()
  const popover = useRef<HTMLDivElement>(null)
  const { hour, minute } = timeParts(value)

  function chooseHour(next: string): void {
    onChange(`${next}:${minute === '' ? '00' : minute}`)
  }

  function chooseMinute(next: string): void {
    onChange(`${hour === '' ? firstVisibleHour : hour}:${next}`)
    popover.current?.hidePopover()
  }

  return (
    <>
      <div
        className={invalid ? 'input input-error w-full' : 'input w-full'}
        style={{ anchorName: '--notice-time' }}
      >
        <input
          id={id}
          className="time-input grow"
          type="time"
          data-empty={value === '' ? '' : undefined}
          step={60}
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="btn btn-ghost btn-square btn-xs -mr-1 text-base-content/45"
          type="button"
          popoverTarget={popoverId}
          aria-haspopup="dialog"
          aria-label="Elegir hora"
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
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
      </div>
      {createPortal(
        <div
          id={popoverId}
          ref={popover}
          popover="auto"
          role="dialog"
          aria-label="Elegir hora"
          className="picker-panel"
          onToggle={(event) => {
            if (event.newState === 'open') scrollToPressed(event.currentTarget)
          }}
          style={{
            position: 'fixed',
            positionAnchor: '--notice-time',
            margin: 0,
            inset: 'auto',
            top: 'calc(anchor(bottom) + 8px)',
            right: 'anchor(right)',
            width: 'max-content'
          }}
        >
          <div className="time-columns">
            <TimeColumn
              title="Hora"
              options={hours}
              selected={hour}
              start={firstVisibleHour}
              onChoose={chooseHour}
            />
            <TimeColumn title="Min" options={minutes} selected={minute} onChoose={chooseMinute} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function TimeColumn({
  title,
  options,
  selected,
  start,
  onChoose
}: {
  title: string
  options: string[]
  selected: string
  start?: string
  onChoose: (value: string) => void
}): React.JSX.Element {
  return (
    <div className="time-column" role="group" aria-label={title}>
      <p className="time-column-title">{title}</p>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          data-start={option === start ? '' : undefined}
          aria-pressed={option === selected}
          onClick={() => onChoose(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
