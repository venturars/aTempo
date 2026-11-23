import { FormEvent, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { destinationAfterSignIn, hasPendingCheckIn } from '../student/checkIn/pendingCheckIn'
import { isInvitationUsed, useActivateStore } from './activateStore'
import { findInvitation, type Invitation } from './invitations'
import { useLoginStore } from './loginStore'

// El enlace del correo de invitación abre este login con ?invitation=<código>.
// Una invitación pendiente pide solo la contraseña; un enlace usado o desconocido abre el login con un aviso.
export function LoginScreen(): React.JSX.Element {
  const { invitation: code } = useSearch({ strict: false })
  const invitation = code === undefined ? undefined : findInvitation(code)
  if (code !== undefined && invitation !== undefined && !isInvitationUsed(invitation)) {
    return <ActivateCard code={code} invitation={invitation} />
  }
  const notice =
    code === undefined
      ? ''
      : invitation === undefined
        ? 'Este enlace de invitación no es válido.'
        : 'Esta invitación ya está activada. Entra con tu contraseña.'
  return <LoginCard notice={notice} />
}

function LoginCard({ notice }: { notice: string }): React.JSX.Element {
  const email = useLoginStore((state) => state.email)
  const password = useLoginStore((state) => state.password)
  const emailError = useLoginStore((state) => state.emailError)
  const passwordError = useLoginStore((state) => state.passwordError)
  const loginError = useLoginStore((state) => state.loginError)
  const setEmail = useLoginStore((state) => state.setEmail)
  const setPassword = useLoginStore((state) => state.setPassword)
  const submit = useLoginStore((state) => state.submit)
  const navigate = useNavigate()
  // Viene del QR de clase sin la sesión abierta: al entrar se apunta la entrada.
  const [fromClassQr] = useState(hasPendingCheckIn)

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (submit()) void navigate({ to: destinationAfterSignIn() })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 md:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold tracking-tight">aTempo</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Hola de nuevo</h1>
            {fromClassQr ? (
              <p className="text-sm text-base-content/60">Entra para registrar tu asistencia.</p>
            ) : null}
          </div>
        </div>
        {notice !== '' ? (
          <div className="alert alert-soft alert-info" role="status">
            <span>{notice}</span>
          </div>
        ) : null}
        <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              className={emailError !== '' ? 'input input-error w-full' : 'input w-full'}
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={emailError !== ''}
              onChange={(event) => setEmail(event.target.value)}
            />
            {emailError !== '' ? <p className="text-sm text-error">{emailError}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={passwordError !== ''}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordError !== '' ? <p className="text-sm text-error">{passwordError}</p> : null}
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
          {loginError !== '' ? (
            <div className="alert alert-soft alert-error" role="alert">
              <span>{loginError}</span>
            </div>
          ) : null}
        </form>
        <p className="text-center text-sm text-base-content/60">
          ¿Primera vez? Entra desde el enlace del correo de invitación.
        </p>
      </section>
    </main>
  )
}

function ActivateCard({
  code,
  invitation
}: {
  code: string
  invitation: Invitation
}): React.JSX.Element {
  const password = useActivateStore((state) => state.password)
  const passwordError = useActivateStore((state) => state.passwordError)
  const setPassword = useActivateStore((state) => state.setPassword)
  const submit = useActivateStore((state) => state.submit)
  const navigate = useNavigate()
  const firstName = invitation.name.split(' ')[0]

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (submit(code)) void navigate({ to: destinationAfterSignIn() })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 md:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold tracking-tight">aTempo</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Hola, {firstName}</h1>
            <p className="text-sm text-base-content/60">
              Elige una contraseña para entrar con {invitation.email}.
            </p>
          </div>
        </div>
        <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="new-password">Contraseña</label>
            <input
              id="new-password"
              className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
              type="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={passwordError !== ''}
              aria-describedby={passwordError !== '' ? 'new-password-error' : 'new-password-hint'}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordError !== '' ? (
              <p id="new-password-error" className="text-sm text-error">
                {passwordError}
              </p>
            ) : (
              <p id="new-password-hint" className="text-sm text-base-content/60">
                Al menos 8 caracteres.
              </p>
            )}
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}
