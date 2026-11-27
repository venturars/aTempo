import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { markBadge, markLabel } from './marks'
import type { MarkChange } from './panelStore'
import { course, type Attendance, type JustKey } from './roster'

const markButton: Record<Attendance, string> = {
  presente: 'btn btn-xs btn-soft btn-success',
  retraso: 'btn btn-xs btn-soft btn-warning',
  ausente: 'btn btn-xs btn-soft btn-error',
  pendiente: 'btn btn-xs btn-soft'
}

export function MarkControl({
  status,
  person = '',
  when = '',
  excuse = 'no',
  arrivalAccepted = false,
  changes = [],
  onPick
}: {
  status: Attendance | 'none'
  person?: string
  when?: string
  arrivalAccepted?: boolean
  excuse?: JustKey
  // Cambios de esta fila con la lista cerrada. Se leen al pasar por encima del estado.
  changes?: MarkChange[]
  onPick: (mark: Attendance) => void
}): React.JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null)
  const isOpen = menu !== null
  // El texto de los cambios para lectores de pantalla describe el botón del estado.
  const noteId = useId()
  // Al elegir o pulsar Escape, el foco vuelve al botón de la fila, no al principio de la página.
  const returnFocus = useRef(false)

  // Después de pintar: si se eligió Ausente, el botón se vuelve a crear dentro del aviso.
  useEffect(() => {
    if (!isOpen && returnFocus.current) {
      returnFocus.current = false
      buttonRef.current?.focus()
    }
  }, [isOpen, status])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    function close(): void {
      setMenu(null)
    }
    // En fase de captura: llega aunque otro control pare la propagación del clic.
    // Así, abrir el menú de otra fila cierra este.
    function closeIfOutside(event: Event): void {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }
      setMenu(null)
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        returnFocus.current = true
        setMenu(null)
      }
    }
    // El menú se pinta al final de la página: el foco entra en él al abrirlo,
    // para poder elegir con el teclado sin pasar por otros controles.
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    // El menú está fijo en la pantalla: si la tabla se mueve, se cierra para no quedar sobre otra fila.
    window.addEventListener('pointerdown', closeIfOutside, true)
    // Con teclado: llevar el foco a otro control también cierra el menú.
    window.addEventListener('focusin', closeIfOutside, true)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', closeIfOutside, true)
      window.removeEventListener('focusin', closeIfOutside, true)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  if (status === 'none') {
    return <span className="opacity-50">—</span>
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
      {/* Siempre el mismo envoltorio: así el botón no se vuelve a crear con el primer cambio
          y el foco sigue en él. La nota solo sale si tiene algo que enseñar. */}
      <MarkNote
        noteId={noteId}
        name={person}
        when={when}
        excuse={status === 'ausente' ? excuse : null}
        changes={changes}
      >
        <button
          ref={buttonRef}
          type="button"
          className={`${markButton[status]} gap-1`}
          aria-haspopup="menu"
          aria-expanded={menu !== null}
          aria-describedby={changes.length > 0 ? noteId : undefined}
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
      </MarkNote>
      {menu !== null
        ? createPortal(
            <ul
              ref={menuRef}
              role="menu"
              className="teacher-panel menu float-panel popover-in rounded-box fixed z-50 p-1.5 shadow-sm"
              style={{ top: menu.top, left: menu.left }}
              onClick={(event) => event.stopPropagation()}
            >
              {(['presente', 'retraso', 'ausente'] as Attendance[])
                .filter((mark) => !arrivalAccepted || mark !== 'ausente')
                .map((mark) => (
                  <li key={mark}>
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => {
                        returnFocus.current = true
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

function changeTime(at: number): string {
  return new Date(at).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function changeText(change: MarkChange): string {
  return `De ${markLabel[change.from]} a ${markLabel[change.to]}`
}

// La nota que sale al pasar por encima del estado (o al llevarle el foco): los cambios hechos
// con la lista cerrada, del más reciente al más antiguo, y el justificante si es una ausencia.
function MarkNote({
  noteId,
  name,
  when,
  excuse,
  changes,
  children
}: {
  noteId: string
  name: string
  when: string
  excuse: JustKey | null
  changes: MarkChange[]
  children: React.ReactNode
}): React.JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const hide = useRef<number | null>(null)
  const [box, setBox] = useState<{ top: number; left: number } | null>(null)
  const filed = excuse === 'ok' || excuse === 'pend'
  const header =
    excuse === 'ok' ? 'Con justificante' : excuse === 'pend' ? 'Por revisar' : 'Sin justificante'
  const newestFirst = [...changes].reverse()

  // Si la fila se va (por ejemplo, al cambiar de pantalla), no queda un cierre pendiente.
  useEffect(
    () => () => {
      if (hide.current !== null) {
        window.clearTimeout(hide.current)
      }
    },
    []
  )

  function show(): void {
    cancelHide()
    // Un estado sin ausencia ni cambios no tiene nota.
    if (excuse === null && newestFirst.length === 0) {
      return
    }
    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect === undefined) {
      return
    }
    // Sin hueco con el estado: la nota empieza justo debajo y su margen de arriba es parte de ella.
    setBox({ top: rect.bottom, left: rect.left })
  }

  // Un margen para llevar el ratón del estado a la nota sin que se cierre.
  // Queda un solo cierre pendiente: si salen el ratón y el foco, el primero no cierra después.
  function scheduleHide(): void {
    cancelHide()
    hide.current = window.setTimeout(() => setBox(null), 300)
  }

  function cancelHide(): void {
    if (hide.current !== null) {
      window.clearTimeout(hide.current)
      hide.current = null
    }
  }

  return (
    <span
      ref={anchorRef}
      className="-my-1 inline-flex py-1"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
      onClick={() => setBox(null)}
    >
      {children}
      {newestFirst.length > 0 ? (
        <span id={noteId} className="sr-only">
          {newestFirst
            .map((change) =>
              [`${changeText(change)}.`, change.reason, `${change.by}.`]
                .filter((part) => part !== '')
                .join(' ')
            )
            .join(' ')}
        </span>
      ) : null}
      {/* La nota está en un portal, pero React la trata como hija del ancla: pasar del estado
          a la nota, o de la nota al estado, no sale del ancla; salir de la nota, sí. */}
      {box !== null
        ? createPortal(
            <span
              className="teacher-panel fixed z-50 pt-1.5"
              style={{ top: box.top, left: box.left }}
              role="tooltip"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="tip popover-in flex w-64 flex-col gap-3 px-3.5 py-3 text-sm leading-snug">
                {newestFirst.map((change, index) => (
                  <span key={`${change.at}-${index}`} className="flex flex-col gap-1">
                    <span className="font-medium">{changeText(change)}</span>
                    {change.reason !== '' ? <span>{change.reason}</span> : null}
                    <span className="tip-body">
                      {change.by} · {changeTime(change.at)}
                    </span>
                  </span>
                ))}
                {excuse !== null ? (
                  <span className="flex flex-col gap-1">
                    <span className="font-medium">{header}</span>
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
                  </span>
                ) : null}
              </span>
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
