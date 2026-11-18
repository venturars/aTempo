import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import { markBadge, markLabel } from './marks'
import type { MarkChange } from './panelStore'
import type { Attendance } from './roster'

// Un cambio de estado pendiente de motivo, con la lista ya cerrada.
export type CorrectionDraft = {
  person: string
  when: string
  to: Attendance
  save: (reason: string) => void
}

export function CorrectionDialog({
  draft,
  onDone
}: {
  draft: CorrectionDraft | null
  onDone: () => void
}): React.JSX.Element | null {
  if (draft === null) {
    return null
  }
  // Un formulario nuevo para cada cambio: el motivo empieza vacío.
  return <CorrectionForm draft={draft} onDone={onDone} />
}

function CorrectionForm({
  draft,
  onDone
}: {
  draft: CorrectionDraft
  onDone: () => void
}): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (reason.trim() === '') {
      setError('Escribe el motivo del cambio.')
      return
    }
    draft.save(reason)
    dialog.current?.close()
  }

  return (
    <dialog ref={dialog} className="modal" aria-labelledby="correction-title" onClose={onDone}>
      <form className="modal-box flex flex-col gap-4" noValidate onSubmit={save}>
        <div className="flex flex-col gap-1">
          <h2 id="correction-title" className="text-lg font-medium">
            Cambiar a {markLabel[draft.to]}
          </h2>
          <p className="text-sm text-base-content/60">
            {draft.person} · {draft.when}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="correction-reason">Motivo</label>
          <textarea
            id="correction-reason"
            className={error !== '' ? 'textarea textarea-error w-full' : 'textarea w-full'}
            rows={3}
            value={reason}
            autoFocus
            aria-invalid={error !== ''}
            aria-describedby={error !== '' ? 'correction-reason-error' : undefined}
            onChange={(event) => {
              setReason(event.target.value)
              setError('')
            }}
          />
          {error !== '' ? (
            <p id="correction-reason-error" className="text-sm">
              {error}
            </p>
          ) : null}
        </div>
        <div className="modal-action mt-0">
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </dialog>
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

// «Editado» junto al estado. Abre los cambios de esa fila: de qué a qué, quién, cuándo y por qué.
export function ChangeLog({
  person,
  when,
  changes
}: {
  person: string
  when: string
  changes: MarkChange[]
}): React.JSX.Element | null {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  if (changes.length === 0) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="cursor-pointer text-xs text-base-content/50 hover:text-base-content"
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation()
          dialog.current?.showModal()
        }}
      >
        Editado
      </button>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-box">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-lg font-medium">
                Cambios
              </h2>
              <p className="text-sm text-base-content/60">
                {person} · {when}
              </p>
            </div>
            <button type="button" className="btn btn-sm" onClick={() => dialog.current?.close()}>
              Cerrar
            </button>
          </div>
          <ol className="mt-2 divide-y divide-base-content/4">
            {changes.map((change, index) => (
              <li key={`${change.at}-${index}`} className="flex flex-col gap-2 py-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className={markBadge[change.from]}>{markLabel[change.from]}</span>
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">a</span>
                  <span className={markBadge[change.to]}>{markLabel[change.to]}</span>
                </span>
                <span>{change.reason}</span>
                <span className="text-base-content/60">
                  {change.by} · {changeTime(change.at)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </>
  )
}
