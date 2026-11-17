import { FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { applyTheme, readTheme, type ThemeName } from '../session/sessionStore'
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
  const [theme, setTheme] = useState<ThemeName>(readTheme)

  function onTheme(): void {
    const next = theme === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro'
    applyTheme(next)
    setTheme(next)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (submit()) void navigate({ to: '/student/dashboard' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-box bg-base-100 p-4 md:p-8">
        <button className="btn btn-ghost w-fit" type="button" onClick={onTheme}>
          {theme === 'atempo-claro' ? 'Tema oscuro' : 'Tema claro'}
        </button>
        <div className="flex flex-col gap-2">
          <p>aTempo</p>
          <h1 className="text-2xl font-medium">Entra con tu correo.</h1>
        </div>
        <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
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
            {emailError !== '' ? <p className="text-sm">{emailError}</p> : null}
          </div>
          <div className="flex flex-col gap-2">
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
            {passwordError !== '' ? <p className="text-sm">{passwordError}</p> : null}
          </div>
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
          {loginError !== '' ? (
            <div className="alert" role="alert">
              <span>{loginError}</span>
            </div>
          ) : null}
        </form>
        <p>
          ¿No tienes cuenta?{' '}
          <Link to="/sign-up" className="link">
            Crear mi cuenta
          </Link>
        </p>
      </section>
    </main>
  )
}
