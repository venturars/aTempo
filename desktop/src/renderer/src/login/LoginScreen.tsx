import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { dashboardPathForProfile, useSessionStore } from '../session/sessionStore'
import { isInvitationUsed, useActivateStore } from './activateStore'
import { findInvitation, type Invitation } from './invitations'
import { useLoginStore } from './loginStore'
import {
  dayInitial,
  dayName,
  markClass,
  markLabelKey,
  trimesterDays,
  type AttendanceMark,
  type TrimesterDay
} from './trimesterExample'
import { weekDays, weekPresencePercent } from './weekExample'
import { LanguagePicker } from '../lang/LanguagePicker'
import { formatNumber } from '../lang/format'
import type { TextKey } from '../lang/messages'
import { useText } from '../lang/useText'

const legendMarks: AttendanceMark[] = ['presente', 'retraso', 'ausencia']

// El aviso del login normal cuando se llega con un enlace de invitación que no sirve.
// Devuelve la clave del aviso, o '' si no hay aviso.
function linkNotice(
  code: string | undefined,
  invitation: Invitation | undefined,
  pending: Invitation | null
): TextKey | '' {
  if (code === undefined) {
    return ''
  }
  if (invitation === undefined) {
    return 'login.notices.unknownLink'
  }
  if (pending === null) {
    return 'login.notices.usedLink'
  }
  return ''
}

export function LoginScreen(): React.JSX.Element {
  // El enlace del correo de invitación abre este mismo login con ?invitation=<código>.
  // Con una invitación pendiente, la tarjeta pide la contraseña y el panel explica qué es aTempo
  // con una semana de ejemplo: quien todavía no tiene cuenta no tiene datos propios.
  const { invitation: code } = useSearch({ strict: false })
  const invitation = code === undefined ? undefined : findInvitation(code)
  const pending = invitation !== undefined && !isInvitationUsed(invitation) ? invitation : null
  const notice = linkNotice(code, invitation, pending)

  if (pending !== null) {
    return (
      <main className="flex min-h-screen flex-col gap-8 p-4 md:flex-row md:p-8">
        <InvitePanel />
        <ActivateForm invitation={pending} />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col gap-8 p-4 md:flex-row md:p-8">
      <ClaimPanel />
      <LoginForm notice={notice} />
    </main>
  )
}

// El panel de la invitación: qué hace aTempo y una semana marcada como ejemplo.
function InvitePanel(): React.JSX.Element {
  const t = useText()
  return (
    <section
      className="flex flex-1 flex-col gap-8 rounded-box bg-base-300 p-4 md:p-8"
      aria-labelledby="invite-claim"
    >
      <div className="flex flex-col gap-2">
        <p>aTempo</p>
        <h2 id="invite-claim" className="text-2xl font-medium">
          {t('login.claim')}
        </h2>
        <p className="text-base-content/70">{t('login.invite.qr')}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{t('login.invite.exampleWeek')}</h3>
          <p className="text-sm text-base-content/70">
            {t('login.invite.weekPresence', { value: formatNumber(weekPresencePercent) })}
          </p>
        </div>
        <MarkChart days={weekDays} />
      </div>
    </section>
  )
}

// Una fila de puntos por día y la leyenda debajo.
function MarkChart({ days }: { days: TrimesterDay[] }): React.JSX.Element {
  const t = useText()
  return (
    <>
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li key={day.date} className="flex items-center gap-3" aria-label={dayName(day)}>
            <span className="w-6 shrink-0">{dayInitial(day)}</span>
            <span className="flex flex-wrap items-center gap-1">
              {day.marks.map((mark, index) => (
                <span
                  key={`${day.date}-${index}`}
                  role="img"
                  className={`${markClass(mark)} shrink-0`}
                  aria-label={t(markLabelKey(mark))}
                />
              ))}
            </span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-4">
        {legendMarks.map((mark) => (
          <li key={mark} className="flex items-center gap-2">
            <span className={`${markClass(mark)} shrink-0`} aria-hidden="true" />
            {t(markLabelKey(mark))}
          </li>
        ))}
      </ul>
    </>
  )
}

function ClaimPanel(): React.JSX.Element {
  const t = useText()
  return (
    <section
      className="flex flex-1 flex-col gap-8 rounded-box bg-base-300 p-4 md:p-8"
      aria-labelledby="claim"
    >
      <div className="flex flex-col gap-2">
        <p>aTempo</p>
        <h1 id="claim" className="text-2xl font-medium">
          {t('login.claim')}
        </h1>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium">{t('login.exampleTrimester')}</h2>
        <MarkChart days={trimesterDays} />
      </div>
    </section>
  )
}

function LoginForm({ notice }: { notice: TextKey | '' }): React.JSX.Element {
  const t = useText()
  const reset = useLoginStore((state) => state.reset)
  // Al salir de la pantalla se vacía el formulario: no queda nada escrito para la próxima vez.
  useEffect(() => reset, [reset])
  const email = useLoginStore((state) => state.email)
  const password = useLoginStore((state) => state.password)
  const emailError = useLoginStore((state) => state.emailError)
  const passwordError = useLoginStore((state) => state.passwordError)
  const loginError = useLoginStore((state) => state.loginError)
  const isSubmitting = useLoginStore((state) => state.isSubmitting)
  const setEmail = useLoginStore((state) => state.setEmail)
  const setPassword = useLoginStore((state) => state.setPassword)
  const submit = useLoginStore((state) => state.submit)
  const submitWithAuth = useLoginStore((state) => state.submitWithAuth)
  const setSubmitting = useLoginStore((state) => state.setSubmitting)
  const showLoginError = useLoginStore((state) => state.showLoginError)
  const navigate = useNavigate()

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    let isValid: boolean
    try {
      const isAuthConfigured = await window.api.auth.isConfigured()
      isValid = isAuthConfigured ? await submitWithAuth() : submit()
    } catch {
      showLoginError()
      return
    } finally {
      setSubmitting(false)
    }
    const profile = useSessionStore.getState().profile

    if (isValid && profile !== null) {
      navigate({ to: dashboardPathForProfile(profile) })
    }
  }

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-4 md:p-8">
      <div className="flex justify-end">
        <LanguagePicker size="xs" />
      </div>
      {notice !== '' ? (
        <div className="alert" role="status">
          <span>{t(notice)}</span>
        </div>
      ) : null}
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <Field
          id="email"
          label={t('login.form.email')}
          type="email"
          autoComplete="username"
          value={email}
          error={emailError}
          onChange={setEmail}
        />
        <Field
          id="password"
          label={t('login.form.password')}
          type="password"
          autoComplete="current-password"
          value={password}
          error={passwordError}
          onChange={setPassword}
        />
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('login.form.submitting') : t('login.form.submit')}
        </button>
        {loginError !== '' ? (
          <div className="alert alert-error" role="alert">
            <span>{t(loginError)}</span>
          </div>
        ) : null}
      </form>
    </section>
  )
}

// La tarjeta del login cuando se llega desde el enlace de una invitación pendiente.
function ActivateForm({ invitation }: { invitation: Invitation }): React.JSX.Element {
  const t = useText()
  const reset = useActivateStore((state) => state.reset)
  // Al salir de la pantalla se vacía el formulario, como en el login.
  useEffect(() => reset, [reset])
  const password = useActivateStore((state) => state.password)
  const passwordError = useActivateStore((state) => state.passwordError)
  const setPassword = useActivateStore((state) => state.setPassword)
  const submit = useActivateStore((state) => state.submit)
  const navigate = useNavigate()
  const [authOnly, setAuthOnly] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    // Con Auth0, la cuenta se crea en el servidor (#189). Hasta entonces la invitación solo vale en la demo.
    let isAuthConfigured = true
    try {
      isAuthConfigured = await window.api.auth.isConfigured()
    } catch {
      // Sin respuesta del puente no se crea una cuenta local.
    }
    if (isAuthConfigured) {
      setAuthOnly(true)
      return
    }
    const isValid = submit(invitation.code)
    const profile = useSessionStore.getState().profile

    if (isValid && profile !== null) {
      navigate({ to: dashboardPathForProfile(profile) })
    }
  }

  const firstName = invitation.name.split(' ')[0] ?? invitation.name

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-4 md:p-8">
      <div className="flex justify-end">
        <LanguagePicker size="xs" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">
          {t('login.activate.greeting', { name: firstName })}
        </h1>
        <p className="text-base-content/70">
          {t('login.activate.intro', { email: invitation.email })}
        </p>
      </div>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <Field
          id="password"
          label={t('login.form.password')}
          hint={t('login.activate.passwordHint')}
          type="password"
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={setPassword}
        />
        <button className="btn btn-primary" type="submit">
          {t('login.form.submit')}
        </button>
        {authOnly ? (
          <div className="alert alert-info" role="alert">
            <span>{t('login.activate.authOnly')}</span>
          </div>
        ) : null}
      </form>
    </section>
  )
}

function Field({
  id,
  label,
  hint = '',
  type,
  autoComplete,
  value,
  error,
  onChange
}: {
  id: string
  label: string
  // Una regla que se lee antes de escribir. Si hay error, el error la sustituye.
  hint?: string
  type: 'email' | 'password'
  autoComplete: string
  value: string
  // La clave del error, o '' si no hay.
  error: TextKey | ''
  onChange: (value: string) => void
}): React.JSX.Element {
  const t = useText()
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base-content" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={error !== '' ? 'input input-error w-full' : 'input w-full'}
        type={type}
        name={id}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error !== ''}
        aria-describedby={error !== '' ? `${id}-error` : hint !== '' ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error !== '' ? (
        <p id={`${id}-error`} className="text-sm text-base-content">
          {t(error)}
        </p>
      ) : hint !== '' ? (
        <p id={`${id}-hint`} className="text-sm text-base-content/60">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
