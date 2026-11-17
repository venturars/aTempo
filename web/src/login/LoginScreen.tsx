import { FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useLoginStore } from './loginStore'

export function LoginScreen(): React.JSX.Element {
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
    if (submit()) void navigate({ to: '/student/dashboard' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 md:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold tracking-tight">aTempo</p>
          <h1 className="text-2xl font-semibold tracking-tight">Hola de nuevo</h1>
        </div>
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
          ¿No tienes cuenta?{' '}
          <Link to="/sign-up" className="link link-primary font-medium">
            Crear mi cuenta
          </Link>
        </p>
      </section>
    </main>
  )
}
