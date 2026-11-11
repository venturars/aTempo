import { FormEvent, useState } from 'react'
import { markClass, markLabel, type AttendanceMark } from '../login/trimesterExample'
import { useRegisterStore } from './registerStore'
import { weekDays, weekPresence } from './weekExample'

const legendMarks: AttendanceMark[] = ['presente', 'retraso', 'ausencia']

export function RegisterScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:flex-row">
      <WeekPanel />
      <RegisterForm />
    </main>
  )
}

function WeekPanel(): React.JSX.Element {
  return (
    <section
      className="flex flex-1 flex-col gap-8 rounded-box bg-base-300 p-8"
      aria-labelledby="claim"
    >
      <div className="flex flex-col gap-2">
        <p>aTempo</p>
        <h1 id="claim" className="text-2xl font-medium">
          Pasar lista ya no es parte de la clase.
        </h1>
      </div>
      <p>Organiza cada sesión.</p>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium">Esta semana</h2>
        <p>{weekPresence}</p>
        <ul className="flex flex-col gap-2">
          {weekDays.map((day) => (
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

function goToLogin(): void {
  window.location.hash = ''
}

function RegisterForm(): React.JSX.Element {
  const name = useRegisterStore((state) => state.name)
  const email = useRegisterStore((state) => state.email)
  const password = useRegisterStore((state) => state.password)
  const repeatPassword = useRegisterStore((state) => state.repeatPassword)
  const nameError = useRegisterStore((state) => state.nameError)
  const emailError = useRegisterStore((state) => state.emailError)
  const passwordError = useRegisterStore((state) => state.passwordError)
  const repeatPasswordError = useRegisterStore((state) => state.repeatPasswordError)
  const submitted = useRegisterStore((state) => state.submitted)
  const setName = useRegisterStore((state) => state.setName)
  const setEmail = useRegisterStore((state) => state.setEmail)
  const setPassword = useRegisterStore((state) => state.setPassword)
  const setRepeatPassword = useRegisterStore((state) => state.setRepeatPassword)
  const submit = useRegisterStore((state) => state.submit)
  const [passwordVisible, setPasswordVisible] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    submit()
  }

  function togglePasswordVisibility(): void {
    setPasswordVisible((visible) => !visible)
  }

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-8">
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-base-content" htmlFor="name">
            Nombre completo
          </label>
          <input
            id="name"
            className={nameError !== '' ? 'input input-error w-full' : 'input w-full'}
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            aria-invalid={nameError !== ''}
            aria-describedby={nameError !== '' ? 'name-error' : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {nameError !== '' ? (
            <p id="name-error" className="text-sm text-base-content">
              {nameError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base-content" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            className={emailError !== '' ? 'input input-error w-full' : 'input w-full'}
            type="email"
            name="email"
            autoComplete="email"
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
          <div className="flex items-center gap-2">
            <input
              id="password"
              className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
              type={passwordVisible ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={passwordError !== ''}
              aria-describedby={passwordError !== '' ? 'password-error' : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button className="btn" type="button" onClick={togglePasswordVisibility}>
              {passwordVisible ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {passwordError !== '' ? (
            <p id="password-error" className="text-sm text-base-content">
              {passwordError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base-content" htmlFor="repeat-password">
            Repetir contraseña
          </label>
          <input
            id="repeat-password"
            className={repeatPasswordError !== '' ? 'input input-error w-full' : 'input w-full'}
            type="password"
            name="repeatPassword"
            autoComplete="new-password"
            value={repeatPassword}
            aria-invalid={repeatPasswordError !== ''}
            aria-describedby={repeatPasswordError !== '' ? 'repeat-password-error' : undefined}
            onChange={(event) => setRepeatPassword(event.target.value)}
          />
          {repeatPasswordError !== '' ? (
            <p id="repeat-password-error" className="text-sm text-base-content">
              {repeatPasswordError}
            </p>
          ) : null}
        </div>
        <button className="btn btn-primary" type="submit">
          Crear mi cuenta
        </button>
        {submitted !== null ? (
          <div className="alert alert-success" role="status">
            <span>Nombre completo: {submitted.name}</span>
            <span>Correo electrónico: {submitted.email}</span>
            <span>Contraseña: {submitted.password}</span>
          </div>
        ) : null}
        <p>
          ¿Ya tienes una cuenta?{' '}
          <button className="btn btn-link" type="button" onClick={goToLogin}>
            Inicia sesión
          </button>
        </p>
      </form>
    </section>
  )
}
