import { FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { dashboardPathForProfile } from '../session/sessionStore'
import { useLoginStore } from './loginStore'
import { markClass, markLabel, trimesterDays, type AttendanceMark } from './trimesterExample'

const legendMarks: AttendanceMark[] = ['presente', 'retraso', 'ausencia']

export function LoginScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-4 md:flex-row md:p-8">
      <ClaimPanel />
      <LoginForm />
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
  const email = useLoginStore((state) => state.email)
  const password = useLoginStore((state) => state.password)
  const emailError = useLoginStore((state) => state.emailError)
  const passwordError = useLoginStore((state) => state.passwordError)
  const submitted = useLoginStore((state) => state.submitted)
  const setEmail = useLoginStore((state) => state.setEmail)
  const setPassword = useLoginStore((state) => state.setPassword)
  const submit = useLoginStore((state) => state.submit)
  const navigate = useNavigate()

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (submit()) {
      navigate({ to: dashboardPathForProfile('student') })
    }
  }

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-4 md:p-8">
      <p>Entra con tu correo.</p>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-base-content" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            className={emailError !== '' ? 'input input-error w-full' : 'input w-full'}
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            aria-invalid={emailError !== ''}
            aria-describedby={emailError !== '' ? 'email-error' : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {emailError !== '' ? (
            <p id="email-error" className="text-sm text-base-content">
              {emailError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base-content" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={passwordError !== ''}
            aria-describedby={passwordError !== '' ? 'password-error' : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          {passwordError !== '' ? (
            <p id="password-error" className="text-sm text-base-content">
              {passwordError}
            </p>
          ) : null}
        </div>
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
        {submitted !== null ? (
          <div className="alert alert-success" role="status">
            <span>Correo: {submitted.email}</span>
            <span>Contraseña: {submitted.password}</span>
          </div>
        ) : null}
      </form>
    </section>
  )
}
