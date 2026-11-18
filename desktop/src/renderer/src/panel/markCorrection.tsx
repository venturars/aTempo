import { FormEvent, useEffect, useRef, useState } from 'react'
import { markLabel } from './marks'
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
