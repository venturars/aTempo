import { FormEvent } from 'react'
import { ClaimPanel } from '../components/ClaimPanel'
import { useLoginStore } from './loginStore'

export function LoginScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:flex-row">
      <ClaimPanel />
      <LoginForm />
    </main>
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

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    submit()
  }

  return (
    <section className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-8">
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
