import { useEffect, useId, useRef, useState } from 'react'
import type { MutationResult } from './adminStore'
import { FormError } from './adminUi'

export function DeleteConfirmation({
  title,
  description,
  onConfirm,
  onCancel,
  onDeleted
}: {
  title: string
  description: string
  onConfirm: () => MutationResult<null>
  onCancel: () => void
  onDeleted: () => void
}): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const descriptionId = useId()
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  function confirm(): void {
    const result = onConfirm()
    if (!result.ok) {
      setError(result.error)
      return
    }
    onDeleted()
  }

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <div className="modal-box flex flex-col gap-5">
        <h2 id={headingId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={descriptionId}>{description}</p>
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button autoFocus type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-error" onClick={confirm}>
            Eliminar
          </button>
        </div>
      </div>
    </dialog>
  )
}
