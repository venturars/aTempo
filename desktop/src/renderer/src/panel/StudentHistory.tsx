import { useRef, useState } from 'react'
import { sessionDateLabel, type HistoryEntry } from './roster'

const labels = {
  presente: 'Presente',
  retraso: 'Tarde',
  ausente: 'Ausente',
  pendiente: 'Pendiente'
}

const badges = {
  presente: 'badge badge-sm badge-soft badge-success',
  retraso: 'badge badge-sm badge-soft badge-warning',
  ausente: 'badge badge-sm badge-soft badge-error',
  pendiente: 'badge badge-sm badge-soft'
}

export function StudentHistory({ entries }: { entries: HistoryEntry[] }): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const [document, setDocument] = useState<HistoryEntry | null>(null)
  return (
    <section aria-labelledby="student-history-title">
      <h2 id="student-history-title" className="py-3 text-base font-medium">
        Historial de asistencia
      </h2>
      <ul className="divide-y divide-base-content/4">
        {entries.map((entry) => (
          <li key={entry.title} className="flex flex-col gap-2 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{sessionDateLabel(entry.title)}</p>
                <p className="text-sm text-base-content/60">
                  {entry.dow} · {entry.sessionTime}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {entry.time !== '—' ? (
                  <time className="text-sm tabular-nums text-base-content/70">{entry.time}</time>
                ) : null}
                <span className={badges[entry.mark]}>{labels[entry.mark]}</span>
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
                Justificante {entry.just === 'ok' ? 'aprobado' : 'pendiente'}
              </button>
            ) : entry.just === 'no' ? (
              <p className="text-sm text-base-content/60">Sin justificante</p>
            ) : null}
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="modal" aria-labelledby="student-document-title">
        <div className="modal-box">
          <h2 id="student-document-title" className="text-lg font-medium">
            Justificante de {document?.name}
          </h2>
          {document ? (
            <p className="mt-2 text-sm text-base-content/70">
              {sessionDateLabel(document.title)} ·{' '}
              {document.just === 'ok' ? 'Aprobado' : 'Pendiente de revisión'}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-base-content/60">
            Vista de ejemplo. El prototipo no incluye un archivo adjunto.
          </p>
          <div className="modal-action">
            <button type="button" className="btn btn-sm" onClick={() => dialog.current?.close()}>
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    </section>
  )
}
