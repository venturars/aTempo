import { useEffect, useRef, useState } from 'react'
import { clockTime } from '../api/isoTime'
import { markOf } from './apiValues'
import { markLabel } from './marks'
import { usePanelStore, type PendingCorrection } from './panelStore'

export function CorrectionReasonDialog(): React.JSX.Element | null {
  const pending = usePanelStore((state) => state.pendingCorrection)
  if (pending === null) {
    return null
  }
  return <ReasonDialog key={pending.studentId} pending={pending} />
}

function sessionDay(startsAt: string | undefined): string {
  if (startsAt === undefined) return ''
  const [year, month, day] = startsAt.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const weekday = date.toLocaleDateString('es', { weekday: 'short' }).replace('.', '')
  const monthName = date.toLocaleDateString('es', { month: 'short' }).replace('.', '')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} ${monthName} ${year}`
}

function ReasonDialog({ pending }: { pending: PendingCorrection }): React.JSX.Element {
  const busy = usePanelStore((state) => state.busy)
  const startsAt = usePanelStore((state) => state.session?.startsAt)
  const [missing, setMissing] = useState(false)
  const error = usePanelStore((state) => state.correctionError)
  const saveCorrection = usePanelStore((state) => state.saveCorrection)
  const cancelCorrection = usePanelStore((state) => state.cancelCorrection)
  const [reason, setReason] = useState('')
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const { status, checkedInAt } = pending.correction
  const title =
    checkedInAt === undefined
      ? `Cambiar a ${markLabel[markOf(status)]}`
      : `Cambiar la entrada a las ${clockTime(checkedInAt)}`
  const message = missing ? 'Escribe el motivo del cambio.' : error

  useEffect(() => {
    const previous = document.activeElement
    fieldRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        cancelCorrection()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus()
      }
    }
  }, [cancelCorrection])

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          cancelCorrection()
        }
      }}
    >
      <form
        className="modal-box popover-in flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (reason.trim() === '') {
            setMissing(true)
            return
          }
          void saveCorrection(reason)
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 id="reason-title" className="text-lg font-medium">
            {title}
          </h2>
          <p className="text-sm text-base-content/60">
            {pending.name} · {sessionDay(startsAt)}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="correction-reason">Motivo</label>
          <textarea
            id="correction-reason"
            ref={fieldRef}
            className={message === null ? 'textarea w-full' : 'textarea textarea-error w-full'}
            rows={3}
            value={reason}
            aria-invalid={message !== null}
            aria-describedby={message === null ? undefined : 'correction-reason-error'}
            onChange={(event) => {
              setReason(event.target.value)
              setMissing(false)
            }}
          />
          {message === null ? null : (
            <p id="correction-reason-error" role="alert" className="text-sm">
              {message}
            </p>
          )}
        </div>
        <div className="modal-action mt-0">
          <button type="button" className="btn" disabled={busy} onClick={cancelCorrection}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
