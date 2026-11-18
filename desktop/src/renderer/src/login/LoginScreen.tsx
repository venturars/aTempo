import { FormEvent, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BackButton } from '../navigation/BackButton'
import { dashboardPathForProfile, useSessionStore } from '../session/sessionStore'
import { useActivateStore } from './activateStore'
import { useLoginStore } from './loginStore'
import { markClass, markLabel, trimesterDays, type AttendanceMark } from './trimesterExample'

const legendMarks: AttendanceMark[] = ['presente', 'retraso', 'ausencia']

// El login tiene dos modos: entrar con la contraseña o activar la cuenta de una invitación.
export function LoginScreen({
  mode = 'login'
}: {
  mode?: 'login' | 'activate'
}): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-4 md:flex-row md:p-8">
      <ClaimPanel />
      {mode === 'activate' ? <ActivateForm /> : <LoginForm />}
    </main>
  )
}

function ClaimPanel(): React.JSX.Element {
  return (
    <section
      className="flex flex-1 flex-col gap-8 rounded-box bg-base-300 p-4 md:p-8"
      aria-labelledby="claim"
    >
      <div className="flex flex-col gap-2">
        <p>aTempo</p>
        <h1 id="claim" className="text-2xl font-medium">
          Pasar lista ya no es parte de la clase.
        </h1>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium">Tu trimestre, sesión a sesión</h2>
        <ul className="flex flex-col gap-2">
          {trimesterDays.map((day) => (
            <li key={day.name} className="flex items-center gap-3" aria-label={day.name}>
              <span className="w-6 shrink-0">{day.label}</span>
              <span className="flex flex-wrap items-center gap-1">
                {day.marks.map((mark, index) => (
                  <span
                    key={`${day.name}-${index}`}
                    role="img"
                    className={`${markClass(mark)} shrink-0`}
                    aria-label={markLabel(mark)}
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
              {markLabel(mark)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function LoginForm(): React.JSX.Element {
  const reset = useLoginStore((state) => state.reset)
  // Al salir de la pantalla se vacía el formulario: no queda nada escrito para la próxima vez.
  useEffect(() => reset, [reset])
  const email = useLoginStore((state) => state.email)
  const password = useLoginStore((state) => state.password)
  const emailError = useLoginStore((state) => state.emailError)
  const passwordError = useLoginStore((state) => state.passwordError)
  const loginError = useLoginStore((state) => state.loginError)
  const setEmail = useLoginStore((state) => state.setEmail)
  const setPassword = useLoginStore((state) => state.setPassword)
  const submit = useLoginStore((state) => state.submit)
  const navigate = useNavigate()

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const isValid = submit()
    const profile = useSessionStore.getState().profile

    if (isValid && profile !== null) {
      navigate({ to: dashboardPathForProfile(profile) })
    }
  }

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-4 md:p-8">
      <p>Entra con tu correo.</p>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <Field
          id="email"
          label="Correo"
          type="email"
          autoComplete="username"
          value={email}
          error={emailError}
          onChange={setEmail}
        />
        <Field
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          error={passwordError}
          onChange={setPassword}
        />
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
        {loginError !== '' ? (
          <div className="alert alert-error" role="alert">
            <span>{loginError}</span>
          </div>
        ) : null}
      </form>
      <button className="btn btn-ghost" type="button" onClick={() => navigate({ to: '/activate' })}>
        Tengo una invitación
      </button>
    </section>
  )
}

function ActivateForm(): React.JSX.Element {
  const reset = useActivateStore((state) => state.reset)
  // Al salir de la pantalla se vacía el formulario, como en el login.
  useEffect(() => reset, [reset])
  const email = useActivateStore((state) => state.email)
  const code = useActivateStore((state) => state.code)
  const password = useActivateStore((state) => state.password)
  const emailError = useActivateStore((state) => state.emailError)
  const codeError = useActivateStore((state) => state.codeError)
  const passwordError = useActivateStore((state) => state.passwordError)
  const activateError = useActivateStore((state) => state.activateError)
  const setEmail = useActivateStore((state) => state.setEmail)
  const setCode = useActivateStore((state) => state.setCode)
  const setPassword = useActivateStore((state) => state.setPassword)
  const submit = useActivateStore((state) => state.submit)
  const navigate = useNavigate()

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const isValid = submit()
    const profile = useSessionStore.getState().profile

    if (isValid && profile !== null) {
      navigate({ to: dashboardPathForProfile(profile) })
    }
  }

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <BackButton onClick={() => navigate({ to: '/' })} />
        <p>Activa tu cuenta con el código de la invitación.</p>
      </div>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <Field
          id="email"
          label="Correo"
          type="email"
          autoComplete="username"
          value={email}
          error={emailError}
          onChange={setEmail}
        />
        <Field
          id="code"
          label="Código de invitación"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          error={codeError}
          onChange={setCode}
        />
        <Field
          id="password"
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={setPassword}
        />
        <button className="btn btn-primary" type="submit">
          Activar cuenta
        </button>
        {activateError !== '' ? (
          <div className="alert alert-error" role="alert">
            <span>{activateError}</span>
          </div>
        ) : null}
      </form>
    </section>
  )
}

function Field({
  id,
  label,
  type,
  inputMode,
  autoComplete,
  value,
  error,
  onChange
}: {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  inputMode?: 'numeric'
  autoComplete: string
  value: string
  error: string
  onChange: (value: string) => void
}): React.JSX.Element {
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
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error !== ''}
        aria-describedby={error !== '' ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error !== '' ? (
        <p id={`${id}-error`} className="text-sm text-base-content">
          {error}
        </p>
      ) : null}
    </div>
  )
}
