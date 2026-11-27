import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useText } from '../lang/useText'
import { useLoginStore } from '../login/loginStore'
import { useSessionStore } from '../session/sessionStore'
import { ThemeToggle } from '../shared/ThemeToggle'

export function AdminEntry({
  dark,
  onTheme
}: {
  dark: boolean
  onTheme: () => void
}): React.JSX.Element {
  const t = useText()
  const [showSignUpNotice, setShowSignUpNotice] = useState(false)
  const email = useLoginStore((state) => state.email)
  const password = useLoginStore((state) => state.password)
  const emailError = useLoginStore((state) => state.emailError)
  const passwordError = useLoginStore((state) => state.passwordError)
  const loginError = useLoginStore((state) => state.loginError)
  const isSubmitting = useLoginStore((state) => state.isSubmitting)
  const setEmail = useLoginStore((state) => state.setEmail)
  const setPassword = useLoginStore((state) => state.setPassword)
  const submitWithAuth = useLoginStore((state) => state.submitWithAuth)
  const navigate = useNavigate()

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!(await submitWithAuth())) return
    const profile = useSessionStore.getState().profile
    if (profile === 'student') void navigate({ to: '/student/dashboard' })
    else void navigate({ to: '/admin' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold">aTempo</p>
          <ThemeToggle dark={dark} onToggle={onTheme} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
          <p className="text-base-content/65">
            Entra para gestionar personas, cursos y sesiones de tu organización.
          </p>
        </div>
        <form className="flex flex-col gap-5" noValidate onSubmit={(event) => void onSubmit(event)}>
          <div className="field">
            <label htmlFor="admin-email">Correo</label>
            <input
              id="admin-email"
              className={emailError ? 'input input-error w-full' : 'input w-full'}
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={emailError !== ''}
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
            />
            {emailError ? <p className="text-sm text-error">{t(emailError)}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              className={passwordError ? 'input input-error w-full' : 'input w-full'}
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={passwordError !== ''}
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordError ? <p className="text-sm text-error">{t(passwordError)}</p> : null}
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
          {loginError ? (
            <div className="alert alert-soft alert-error" role="alert">
              <span>{t(loginError)}</span>
            </div>
          ) : null}
        </form>
        <p className="text-sm text-base-content/60">
          ¿Tu organización aún no usa aTempo?{' '}
          <button
            type="button"
            className="link link-primary font-medium"
            onClick={() => setShowSignUpNotice(true)}
          >
            Crear cuenta
          </button>
        </p>
        {showSignUpNotice ? (
          <p className="alert alert-soft alert-info" role="status">
            Crear una cuenta todavía no está disponible.
          </p>
        ) : null}
        <Link className="link w-fit text-sm" to="/">
          Volver al acceso del alumno
        </Link>
      </section>
    </main>
  )
}
