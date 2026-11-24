import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTeacherAccountsStore } from '../login/teacherAccounts'

export function ChangePasswordDialog({
  onClose,
  onSaved
}: {
  onClose: () => void
  onSaved: () => void
}): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const result = useTeacherAccountsStore
      .getState()
      .changePassword(
        String(fields.get('current') ?? ''),
        String(fields.get('next') ?? ''),
        String(fields.get('confirmation') ?? '')
      )
    if (result) {
      setError(result)
      return
    }
    dialog.current?.close()
    onSaved()
  }

  return (
    <dialog ref={dialog} className="modal" aria-labelledby="password-title" onClose={onClose}>
      <form className="modal-box flex flex-col gap-4" onSubmit={save} onChange={() => setError('')}>
        <h2 id="password-title" className="text-lg font-medium">
          Cambiar contraseña
        </h2>
        <label className="flex flex-col gap-2">
          Contraseña actual
          <input
            className="input w-full"
            type="password"
            name="current"
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          Nueva contraseña
          <input
            className="input w-full"
            type="password"
            name="next"
            autoComplete="new-password"
            aria-describedby="new-password-hint"
            required
          />
          <span id="new-password-hint" className="text-sm text-base-content/60">
            Al menos 8 caracteres.
          </span>
        </label>
        <label className="flex flex-col gap-2">
          Repite la nueva contraseña
          <input
            className="input w-full"
            type="password"
            name="confirmation"
            autoComplete="new-password"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-action mt-0">
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar contraseña
          </button>
        </div>
      </form>
    </dialog>
  )
}
