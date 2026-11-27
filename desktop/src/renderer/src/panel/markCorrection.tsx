import { FormEvent, useEffect, useRef, useState } from 'react'
import type { TextKey } from '../language/messages'
import { useText } from '../language/useText'
import { markLabel } from './marks'
import type { Attendance } from './roster'

// Un cambio de estado con la lista ya cerrada. El motivo es opcional.
export type CorrectionDraft = {
  person: string
  when: string
  to: Attendance
  // Guarda el cambio. Devuelve false si no se ha guardado; el diálogo sigue abierto con failText.
  save: (reason: string) => boolean
  failText: TextKey
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
  const t = useText()
  const dialog = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<TextKey | null>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!draft.save(reason)) {
      setError(draft.failText)
      return
    }
    dialog.current?.close()
  }

  return (
    <dialog ref={dialog} className="modal" aria-labelledby="correction-title" onClose={onDone}>
      <form className="modal-box flex flex-col gap-4" noValidate onSubmit={save}>
        <div className="flex flex-col gap-1">
          <h2 id="correction-title" className="text-lg font-medium">
            {t('panel.correction.changeTo', { mark: markLabel(draft.to) })}
          </h2>
          <p className="text-sm text-base-content/60">
            {draft.person} · {draft.when}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="correction-reason">
            {t('panel.correction.reason')}{' '}
            <span className="field-optional">· {t('panel.correction.recommended')}</span>
          </label>
          <textarea
            id="correction-reason"
            className={error !== null ? 'textarea textarea-error w-full' : 'textarea w-full'}
            rows={3}
            value={reason}
            autoFocus
            aria-invalid={error !== null}
            aria-describedby={error !== null ? 'correction-reason-error' : undefined}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
          />
          {error !== null ? (
            <p id="correction-reason-error" className="text-sm">
              {t(error)}
            </p>
          ) : null}
        </div>
        <div className="modal-action mt-0">
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('common.save')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
