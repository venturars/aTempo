import { useRef } from 'react'
import { classSessions, compareStudentNames, sessionDateLabel } from './roster'
import { usePanelStore } from './panelStore'

export function JustificationAccess(): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const openStudent = usePanelStore((state) => state.openStudent)
  const sessionMarks = usePanelStore((state) => state.sessionMarks)
  const documents = classSessions.flatMap((session) =>
    (session.rows ?? [])
      .map((row) => ({
        ...row,
        mark: sessionMarks[session.id]?.[row.name] ?? row.mark,
        session
      }))
      .filter((row) => row.mark === 'ausente' && (row.just === 'pend' || row.just === 'ok'))
      .sort((a, b) => compareStudentNames(a.name, b.name))
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
        className="btn btn-sm shrink-0"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        Justificantes{pending ? ` · ${pending}` : ''}
      </button>
      <dialog ref={dialog} className="modal" aria-labelledby="justifications-title" onCancel={close}>
        <div className="modal-box">
          <div className="flex items-center justify-between gap-3">
            <h2 id="justifications-title" className="text-lg font-medium">
              Justificantes
            </h2>
            <button type="button" className="btn btn-sm" onClick={close}>
              Cerrar
            </button>
          </div>
          {documents.length ? (
            <ul className="mt-2 divide-y divide-base-content/4">
              {documents.map((document) => (
                <li key={`${document.name}-${document.session.id}`}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 py-3 text-left text-sm hover:text-primary"
                    onClick={() => {
                      close()
                      openStudent(document.name)
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{document.name}</span>
                      <span className="text-base-content/60">
                        {sessionDateLabel(document.session.id)}
                      </span>
                    </span>
                    <span
                      className={`badge badge-sm badge-soft ${
                        document.just === 'pend' ? '' : 'badge-success'
                      }`}
                    >
                      {document.just === 'pend' ? 'Pendiente' : 'Aprobado'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-base-content/60">No hay justificantes.</p>
          )}
        </div>
      </dialog>
    </>
  )
}
