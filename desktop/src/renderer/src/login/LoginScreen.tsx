import { FormEvent } from 'react'
import { useLoginStore } from './loginStore'

export function LoginScreen(): React.JSX.Element {
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
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-md rounded-box bg-base-100 p-8">
        <h1 className="text-3xl font-semibold text-base-content">aTempo</h1>
        <p className="mt-2 text-secondary">Entra con tu correo.</p>
        <form className="mt-8 flex flex-col gap-5" noValidate onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-base-content" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              className="input login-field w-full"
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
              className="input login-field w-full"
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
    </main>
  )
}
