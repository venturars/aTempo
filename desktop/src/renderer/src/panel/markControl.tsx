import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { markBadge, markLabel } from './marks'
import { course, type Attendance, type JustKey } from './roster'

const markButton: Record<Attendance, string> = {
  presente: 'btn btn-xs btn-soft btn-success',
  retraso: 'btn btn-xs btn-soft btn-warning',
  ausente: 'btn btn-xs btn-soft btn-error',
  pendiente: 'btn btn-xs btn-soft'
}

export function MarkControl({
  status,
  enabled,
  person = '',
  when = '',
  excuse = 'no',
  onPick
}: {
  status: Attendance | 'none'
  enabled: boolean
  person?: string
  when?: string
  excuse?: JustKey
  onPick: (mark: Attendance) => void
}): React.JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (menu === null) {
      return
    }
    function close(): void {
      setMenu(null)
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setMenu(null)
      }
    }
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  if (status === 'none') {
    return <span className="opacity-50">—</span>
  }

  const noted = (pill: React.ReactNode): React.ReactNode =>
    status === 'ausente' ? (
      <AbsenceNote name={person} when={when} excuse={excuse}>
        {pill}
      </AbsenceNote>
    ) : (
      pill
    )

  if (!enabled) {
    return <>{noted(<span className={markBadge[status]}>{markLabel[status]}</span>)}</>
  }

  function toggle(event: React.MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation()
    if (menu !== null) {
      setMenu(null)
      return
    }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect === undefined) {
      return
    }
    setMenu({ top: rect.bottom + 4, left: rect.left })
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      {noted(
        <button
          ref={buttonRef}
          type="button"
          className={`${markButton[status]} gap-1`}
          aria-haspopup="menu"
          aria-expanded={menu !== null}
          onClick={toggle}
        >
          {markLabel[status]}
          <svg viewBox="0 0 16 16" className="size-3 opacity-70" fill="none" aria-hidden="true">
            <path
              d="M4 6.5 8 10.5 12 6.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {menu !== null
        ? createPortal(
            <ul
              role="menu"
              className="teacher-panel menu float-panel popover-in rounded-box fixed z-50 p-1.5 shadow-sm"
              style={{ top: menu.top, left: menu.left }}
              onClick={(event) => event.stopPropagation()}
            >
              {(['presente', 'retraso', 'ausente'] as Attendance[]).map((mark) => (
                <li key={mark}>
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() => {
                      setMenu(null)
                      onPick(mark)
                    }}
                  >
                    <span className={markBadge[mark]}>{markLabel[mark]}</span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body
          )
        : null}
    </div>
  )
}

function AbsenceNote({
  name,
  when,
  excuse,
  children
}: {
  name: string
  when: string
  excuse: JustKey
  children: React.ReactNode
}): React.JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const hide = useRef<number | null>(null)
  const [box, setBox] = useState<{ top: number; left: number } | null>(null)
  const filed = excuse === 'ok' || excuse === 'pend'
  const header =
    excuse === 'ok' ? 'Con justificante' : excuse === 'pend' ? 'Por revisar' : 'Sin justificante'

  function show(): void {
    if (hide.current !== null) {
      window.clearTimeout(hide.current)
    }
    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect === undefined) {
      return
    }
    setBox({ top: rect.bottom + 6, left: rect.left })
  }

  function scheduleHide(): void {
    hide.current = window.setTimeout(() => setBox(null), 140)
  }

  return (
    <span
      ref={anchorRef}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onClick={() => setBox(null)}
    >
      {children}
      {box !== null
        ? createPortal(
            <span
              className="teacher-panel tip popover-in fixed z-50 flex w-56 flex-col gap-1 px-3.5 py-3 text-sm leading-snug"
              style={{ top: box.top, left: box.left }}
              onMouseEnter={show}
              onMouseLeave={scheduleHide}
              onClick={(event) => event.stopPropagation()}
            >
              <span className="font-medium tracking-tight">{header}</span>
              {filed ? (
                <button
                  type="button"
                  className="mt-1 w-fit cursor-pointer border-0 bg-transparent p-0 text-sm font-medium underline"
                  onClick={() => downloadSampleNote(name, when)}
                >
                  Descargar
                </button>
              ) : (
                <span className="tip-body">No hay documento.</span>
              )}
            </span>,
            document.body
          )
        : null}
    </span>
  )
}

function downloadSampleNote(name: string, when: string): void {
  const text = [
    'Justificante de muestra',
    name,
    when,
    course.name,
    'No es un documento real.'
  ].join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const link = document.createElement('a')
  const slug = `${name}-${when}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  link.href = url
  link.download = `justificante-${slug}.txt`
  link.click()
  URL.revokeObjectURL(url)
}
