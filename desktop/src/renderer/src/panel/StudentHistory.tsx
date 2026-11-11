import { useRef, useState } from 'react'
import { AttendanceStatus } from './AttendanceStatus'
import { sessionDateLabel, type HistoryEntry } from './roster'

const labels = {
  presente: 'Presente',
  retraso: 'Retraso',
  ausente: 'Ausencia',
  pendiente: 'Pendiente'
}

export function StudentHistory({ entries }: { entries: HistoryEntry[] }): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const [document, setDocument] = useState<HistoryEntry | null>(null)
  return (
    <section className="student-history" aria-labelledby="student-history-title">
      <h2 id="student-history-title">Historial de asistencia</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.title}>
            <div className="student-session-main">
              <div className="student-session-date">
                <span>{sessionDateLabel(entry.title)}</span>
                <span>
                  {entry.dow} · {entry.sessionTime}
                </span>
              </div>
              <div className="student-session-result">
                <span>{labels[entry.mark]}</span>
                {entry.time !== '—' ? <time>{entry.time}</time> : null}
                <AttendanceStatus mark={entry.mark} />
              </div>
            </div>
            {entry.just === 'pend' || entry.just === 'ok' ? (
              <button
                type="button"
                className="student-session-document"
                onClick={() => {
                  setDocument(entry)
                  dialog.current?.showModal()
                }}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h6" />
                </svg>
                Justificante {entry.just === 'ok' ? 'aprobado' : 'pendiente'}
                <span aria-hidden="true">↗</span>
              </button>
            ) : entry.just === 'no' ? (
              <p className="student-session-no-document">Sin justificante</p>
            ) : null}
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="modal" aria-labelledby="student-document-title">
        <div className="modal-box">
          <h2 id="student-document-title">Justificante de {document?.name}</h2>
          {document ? (
            <p className="mt-2 text-sm">
              {sessionDateLabel(document.title)} ·{' '}
              {document.just === 'ok' ? 'Aprobado' : 'Pendiente de revisión'}
            </p>
          ) : null}
          <p className="mt-4 text-sm">
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
