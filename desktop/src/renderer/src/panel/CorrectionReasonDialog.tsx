import { useEffect, useRef, useState } from 'react'
import { clockTime } from '../api/isoTime'
import { formatDate, formatTime } from '../language/format'
import { text, useText } from '../language/useText'
import { markOf } from './apiValues'
import { markLabel } from './marks'
import { correctionErrorText, usePanelStore, type PendingCorrection } from './panelStore'

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
  const weekday = formatDate(date, { weekday: 'short' }).replace('.', '')
  const monthName = formatDate(date, { month: 'short' }).replace('.', '')
  // «Mar 10 nov 2026»: Intl escribe el día de la semana en minúscula.
  return text('panel.correction.sessionDay', {
    weekday: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`,
    day,
    month: monthName,
    year
  })
}

function ReasonDialog({ pending }: { pending: PendingCorrection }): React.JSX.Element {
  const t = useText()
  const busy = usePanelStore((state) => state.busy)
  const startsAt = usePanelStore((state) => state.session?.startsAt)
  const error = usePanelStore((state) => state.correctionError)
  const saveCorrection = usePanelStore((state) => state.saveCorrection)
  const cancelCorrection = usePanelStore((state) => state.cancelCorrection)
  const [reason, setReason] = useState('')
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const { status, checkedInAt } = pending.correction
  const title =
    checkedInAt === undefined
      ? t('panel.correction.changeTo', { mark: markLabel(markOf(status)) })
      : t('panel.correction.changeArrival', { time: formatTime(clockTime(checkedInAt)) })
  const message = error === null ? null : correctionErrorText(error)

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
          <label htmlFor="correction-reason">
            {t('panel.correction.reason')}{' '}
            <span className="field-optional">· {t('panel.correction.recommended')}</span>
          </label>
          <textarea
            id="correction-reason"
            ref={fieldRef}
            className={message === null ? 'textarea w-full' : 'textarea textarea-error w-full'}
            rows={3}
            value={reason}
            aria-invalid={message !== null}
            aria-describedby={message === null ? undefined : 'correction-reason-error'}
            onChange={(event) => setReason(event.target.value)}
          />
          {message === null ? null : (
            <p id="correction-reason-error" role="alert" className="text-sm">
              {message}
            </p>
          )}
        </div>
        <div className="modal-action mt-0">
          <button type="button" className="btn" disabled={busy} onClick={cancelCorrection}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
