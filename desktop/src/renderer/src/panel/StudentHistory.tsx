import { useRef, useState } from 'react'
import { formatTime } from '../language/format'
import { useText } from '../language/useText'
import { markBadge, markLabel } from './marks'
import { sessionDateLabel, sessionWeekday, timeRangeLabel, type HistoryEntry } from './roster'

export function StudentHistory({ entries }: { entries: HistoryEntry[] }): React.JSX.Element {
  const t = useText()
  const dialog = useRef<HTMLDialogElement>(null)
  const [document, setDocument] = useState<HistoryEntry | null>(null)
  return (
    <section aria-labelledby="student-history-title">
      <h2 id="student-history-title" className="py-3 text-base font-medium">
        {t('history.title')}
      </h2>
      <ul className="divide-y divide-base-content/4">
        {entries.map((entry) => (
          <li key={entry.sessionId} className="flex flex-col gap-2 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{sessionDateLabel(entry.sessionId)}</p>
                <p className="text-sm text-base-content/60">
                  {sessionWeekday(entry.sessionId)} · {timeRangeLabel(entry.sessionTime)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {entry.time !== '—' ? (
                  <time className="text-sm tabular-nums text-base-content/70">
                    {formatTime(entry.time)}
                  </time>
                ) : null}
                <span className={markBadge[entry.mark]}>{markLabel(entry.mark)}</span>
              </div>
            </div>
            {entry.just === 'pend' || entry.just === 'ok' ? (
              <button
                type="button"
                className="w-fit cursor-pointer text-left text-sm text-base-content/60 hover:text-base-content"
                onClick={() => {
                  setDocument(entry)
                  dialog.current?.showModal()
                }}
              >
                {entry.just === 'ok'
                  ? t('history.justificationApproved')
                  : t('history.justificationPending')}
              </button>
            ) : entry.just === 'no' ? (
              <p className="text-sm text-base-content/60">{t('history.noJustification')}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="modal" aria-labelledby="student-document-title">
        <div className="modal-box">
          <h2 id="student-document-title" className="text-lg font-medium">
            {t('history.documentTitle', { name: document?.name ?? '' })}
          </h2>
          {document ? (
            <p className="mt-2 text-sm text-base-content/70">
              {sessionDateLabel(document.sessionId)} ·{' '}
              {document.just === 'ok' ? t('history.approved') : t('history.pendingReview')}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-base-content/60">{t('history.sampleNotice')}</p>
          <div className="modal-action">
            <button type="button" className="btn btn-sm" onClick={() => dialog.current?.close()}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  )
}
