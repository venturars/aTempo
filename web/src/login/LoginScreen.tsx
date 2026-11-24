import { FormEvent, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { destinationAfterSignIn, hasPendingCheckIn } from '../student/checkIn/pendingCheckIn'
import { activateInvitation, isInvitationUsed } from './activateStore'
import { findInvitation, type Invitation } from './invitations'
import { useLoginStore } from './loginStore'
import type { ActivationErrors, ActivationForm } from './validateActivation'

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

const noErrors: ActivationErrors = {
  firstName: '',
  lastName: '',
  identificationDocument: '',
  password: ''
}

function ActivateCard({
  code,
  invitation
}: {
  code: string
  invitation: Invitation
}): React.JSX.Element {
  // Nombre y apellidos llegan de quien invita; el alumno los corrige si hace falta y completa el resto.
  const [form, setForm] = useState<ActivationForm>({
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    identificationDocument: '',
    password: ''
  })
  const [errors, setErrors] = useState<ActivationErrors>(noErrors)
  const navigate = useNavigate()

  function change(field: keyof ActivationForm, value: string): void {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = activateInvitation(code, form)
    if (result.entered) void navigate({ to: destinationAfterSignIn() })
    else setErrors(result.errors)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 md:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold tracking-tight">aTempo</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Hola, {invitation.firstName}</h1>
            <p className="text-sm text-base-content/60">
              Completa tus datos y elige una contraseña para entrar con {invitation.email}.
            </p>
          </div>
        </div>
        <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
          <ActivateField
            id="first-name"
            label="Nombre"
            autoComplete="given-name"
            value={form.firstName}
            error={errors.firstName}
            onChange={(value) => change('firstName', value)}
          />
          <ActivateField
            id="last-name"
            label="Apellidos"
            autoComplete="family-name"
            value={form.lastName}
            error={errors.lastName}
            onChange={(value) => change('lastName', value)}
          />
          <ActivateField
            id="identification-document"
            label="Documento de identidad"
            hint="DNI, NIE o pasaporte."
            autoComplete="off"
            value={form.identificationDocument}
            error={errors.identificationDocument}
            onChange={(value) => change('identificationDocument', value)}
          />
          <ActivateField
            id="new-password"
            label="Contraseña"
            hint="Al menos 8 caracteres."
            type="password"
            autoComplete="new-password"
            value={form.password}
            error={errors.password}
            onChange={(value) => change('password', value)}
          />
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}

function ActivateField({
  id,
  label,
  hint = '',
  type = 'text',
  autoComplete,
  value,
  error,
  onChange
}: {
  id: string
  label: string
  hint?: string
  type?: 'text' | 'password'
  autoComplete: string
  value: string
  error: string
  onChange: (value: string) => void
}): React.JSX.Element {
  const describedBy = error !== '' ? `${id}-error` : hint !== '' ? `${id}-hint` : undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={error !== '' ? 'input input-error w-full' : 'input w-full'}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error !== ''}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {error !== '' ? (
        <p id={`${id}-error`} className="text-sm text-error">
          {error}
        </p>
      ) : hint !== '' ? (
        <p id={`${id}-hint`} className="text-sm text-base-content/60">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
