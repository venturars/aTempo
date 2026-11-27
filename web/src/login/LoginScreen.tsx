import { useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { destinationAfterSignIn, hasPendingCheckIn } from '../student/checkIn/pendingCheckIn'
import { LanguagePicker } from '../lang/LanguagePicker'
import { useText } from '../lang/useText'
import { ThemeToggle } from '../shared/ThemeToggle'
import { applyTheme, readTheme, useSessionStore, type ThemeName } from '../session/sessionStore'
import { useLoginStore } from './loginStore'

// Auth0 gestiona las invitaciones y altas fuera de este prototipo.
export function LoginScreen(): React.JSX.Element {
  const t = useText()
  const { invitation } = useSearch({ strict: false })
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
  const [theme, setTheme] = useState<ThemeName>(readTheme)
  const [fromClassQr] = useState(hasPendingCheckIn)

  function onTheme(): void {
    const next = theme === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro'
    applyTheme(next)
    setTheme(next)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!(await submitWithAuth())) return
    if (useSessionStore.getState().profile === 'admin') void navigate({ to: '/admin' })
    else void navigate({ to: destinationAfterSignIn() })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">aTempo</p>
          <div className="ml-auto flex items-center gap-3">
            <LanguagePicker size="xs" />
            <ThemeToggle dark={theme === 'atempo-oscuro'} onToggle={onTheme} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
            {fromClassQr ? (
              <p className="text-sm text-base-content/60">{t('login.fromClassQr')}</p>
            ) : null}
          </div>
        </div>
        {invitation !== undefined ? (
          <div className="alert alert-soft alert-info" role="status">
            <span>{t('login.invitationUnavailable')}</span>
          </div>
        ) : null}
        <form className="flex flex-col gap-5" noValidate onSubmit={(event) => void onSubmit(event)}>
          <div className="field">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              id="email"
              className={emailError !== '' ? 'input input-error w-full' : 'input w-full'}
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={emailError !== ''}
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
            />
            {emailError !== '' ? <p className="text-sm text-error">{t(emailError)}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={passwordError !== ''}
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordError !== '' ? <p className="text-sm text-error">{t(passwordError)}</p> : null}
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </button>
          {loginError !== '' ? (
            <div className="alert alert-soft alert-error" role="alert">
              <span>{t(loginError)}</span>
            </div>
          ) : null}
        </form>
        <p className="text-center text-sm text-base-content/60">
          {t('login.newAccountsUnavailable')}
        </p>
      </section>
    </main>
  )
}
