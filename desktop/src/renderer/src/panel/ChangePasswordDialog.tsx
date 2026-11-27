import { useEffect, useRef, useState, type FormEvent } from 'react'
import { PasswordInput } from '../login/PasswordInput'
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
        {/* Etiquetas con htmlFor: dentro de un label, el botón de ojo se sumaría al nombre del campo. */}
        <div className="flex flex-col gap-2">
          <label htmlFor="current-password">Contraseña actual</label>
          <PasswordInput
            id="current-password"
            name="current"
            autoComplete="current-password"
            autoFocus
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="next-password">Nueva contraseña</label>
          <PasswordInput
            id="next-password"
            name="next"
            autoComplete="new-password"
            aria-describedby="new-password-hint"
            required
          />
          <span id="new-password-hint" className="text-sm text-base-content/60">
            Al menos 8 caracteres.
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="confirmation-password">Repite la nueva contraseña</label>
          <PasswordInput
            id="confirmation-password"
            name="confirmation"
            autoComplete="new-password"
            required
          />
        </div>
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
