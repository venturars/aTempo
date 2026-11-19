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

function ReasonDialog({ pending }: { pending: PendingCorrection }): React.JSX.Element {
  const busy = usePanelStore((state) => state.busy)
  const saveCorrection = usePanelStore((state) => state.saveCorrection)
  const cancelCorrection = usePanelStore((state) => state.cancelCorrection)
  const [reason, setReason] = useState('')
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const { status, checkedInAt } = pending.correction
  const change =
    checkedInAt === undefined
      ? markLabel[markOf(status)]
      : `${markLabel[markOf(status)]}, entrada a las ${clockTime(checkedInAt)}`

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
        className="modal-box popover-in"
        onSubmit={(event) => {
          event.preventDefault()
          void saveCorrection(reason)
        }}
      >
        <h2 id="reason-title" className="text-lg font-medium">
          Motivo del cambio
        </h2>
        <p className="py-3">
          {pending.name}: {change}
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Motivo
          <textarea
            ref={fieldRef}
            className="textarea w-full"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="modal-action">
          <button type="button" className="btn" disabled={busy} onClick={cancelCorrection}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || reason.trim() === ''}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
