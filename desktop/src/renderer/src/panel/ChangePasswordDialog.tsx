import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { TextKey } from '../lang/messages'
import { useText } from '../lang/useText'
import { useTeacherAccountsStore } from '../login/teacherAccounts'

export function ChangePasswordDialog({
  onClose,
  onSaved
}: {
  onClose: () => void
  onSaved: () => void
}): React.JSX.Element {
  const t = useText()
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<TextKey | ''>('')

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
          {t('panel.password.title')}
        </h2>
        <label className="flex flex-col gap-2">
          {t('panel.password.current')}
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
          {t('panel.password.next')}
          <input
            className="input w-full"
            type="password"
            name="next"
            autoComplete="new-password"
            aria-describedby="new-password-hint"
            required
          />
          <span id="new-password-hint" className="text-sm text-base-content/60">
            {t('panel.password.hint')}
          </span>
        </label>
        <label className="flex flex-col gap-2">
          {t('panel.password.confirmation')}
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
            {t(error)}
          </p>
        ) : null}
        <div className="modal-action mt-0">
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('panel.password.save')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
