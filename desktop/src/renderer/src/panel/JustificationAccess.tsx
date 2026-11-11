import { useRef } from 'react'
import { classSessions, compareStudentNames, sessionDateLabel } from './roster'
import { usePanelStore } from './panelStore'

export function JustificationAccess(): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const openStudent = usePanelStore((state) => state.openStudent)
  const documents = classSessions.flatMap((session) =>
    (session.rows ?? [])
      .filter((row) => row.just === 'pend' || row.just === 'ok')
      .sort((a, b) => compareStudentNames(a.name, b.name))
      .map((row) => ({ ...row, session }))
  )
  const pending = documents.filter((document) => document.just === 'pend').length

  function close(): void {
    dialog.current?.close()
    trigger.current?.focus()
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="btn btn-sm justification-trigger"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        Justificantes{pending ? ` · ${pending}` : ''}
      </button>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="justifications-title"
        onCancel={close}
      >
        <div className="modal-box justification-dialog">
          <div className="justification-heading">
            <h2 id="justifications-title">Justificantes</h2>
            <button type="button" className="btn btn-sm" onClick={close}>
              Cerrar
            </button>
          </div>
          <ul className="justification-list">
            {documents.map((document) => (
              <li key={`${document.name}-${document.session.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    close()
                    openStudent(document.name)
                  }}
                >
                  <span>
                    <span className="block">{document.name}</span>
                    <span className="justification-date">
                      {sessionDateLabel(document.session.id)}
                    </span>
                  </span>
                  <span>{document.just === 'pend' ? 'Pendiente' : 'Aprobado'}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ul>
          {!documents.length ? <p>No hay justificantes.</p> : null}
        </div>
      </dialog>
    </>
  )
}
