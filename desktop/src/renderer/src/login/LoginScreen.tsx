import { FormEvent, useId, useState } from 'react'
import { LoginQuarterBeats } from './LoginQuarterBeats'
import { TempitoIllustration } from './TempitoIllustration'
import { useLoginStore } from './loginStore'

function BrandWordmark({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <p className={`text-2xl font-extrabold tracking-tight ${className}`}>
      a<span className="font-medium opacity-75">·</span>Tempo
    </p>
  )
}

export function LoginScreen(): React.JSX.Element {
  const rememberId = useId()
  const [rememberSession, setRememberSession] = useState(true)

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
    <div className="flex min-h-screen flex-col bg-base-200 lg:flex-row">
      <aside className="relative flex flex-col gap-8 bg-primary px-6 py-12 text-primary-content lg:max-w-[760px] lg:flex-1 lg:justify-between lg:px-16 lg:py-14">
        <BrandWordmark />

        <div className="relative lg:max-w-xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-5xl">
            Pasar lista ya no es parte de la clase.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-content/80 lg:text-lg">
            aTempo registra entradas, retrasos y salidas para que alumnado, profesorado y centro compartan la
            misma asistencia, con evidencias que se pueden demostrar.
          </p>
        </div>

        <div className="lg:hidden">
          <LoginQuarterBeats compact />
        </div>
        <div className="hidden lg:block">
          <LoginQuarterBeats />
        </div>

        <TempitoIllustration
          size="lg"
          className="pointer-events-none absolute right-6 top-10 hidden text-primary-content lg:right-16 lg:block"
        />
        <TempitoIllustration
          size="md"
          className="pointer-events-none absolute right-5 top-12 text-primary-content lg:hidden"
        />
      </aside>

      <main className="flex flex-1 flex-col justify-between bg-base-100 px-6 py-10 lg:px-16 lg:py-14">
        <p className="hidden text-end text-sm text-base-content/70 lg:block">
          ¿Tu centro aún no usa aTempo?{' '}
          <a className="font-semibold text-primary" href="#demo">
            Solicita una demo
          </a>
        </p>

        <section className="mx-auto w-full max-w-md lg:mt-8">
          <h2 className="text-2xl font-bold tracking-tight lg:text-4xl">Inicia sesión</h2>
          <p className="mt-2 text-base text-base-content/70">
            Usa la cuenta que te ha dado tu centro. Te llevaremos a tu panel según tu perfil.
          </p>

          <form className="mt-8 flex flex-col" noValidate onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                className={`input w-full ${emailError !== '' ? 'input-error' : ''}`}
                type="email"
                name="email"
                autoComplete="username"
                placeholder="nombre@tucentro.es"
                value={email}
                aria-invalid={emailError !== ''}
                aria-describedby={emailError !== '' ? 'email-error' : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
              {emailError !== '' ? (
                <p id="email-error" className="text-sm text-error">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <label className="text-sm font-semibold" htmlFor="password">
                  Contraseña
                </label>
                <a className="text-sm font-semibold text-primary" href="#recuperar">
                  ¿Has olvidado la contraseña?
                </a>
              </div>
              <input
                id="password"
                className={`input w-full ${passwordError !== '' ? 'input-error' : ''}`}
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                aria-invalid={passwordError !== ''}
                aria-describedby={passwordError !== '' ? 'password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
              {passwordError !== '' ? (
                <p id="password-error" className="text-sm text-error">
                  {passwordError}
                </p>
              ) : null}
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-base-content/70">
              <input
                checked={rememberSession}
                className="checkbox checkbox-primary checkbox-sm"
                id={rememberId}
                type="checkbox"
                onChange={(event) => setRememberSession(event.target.checked)}
              />
              Mantener la sesión iniciada en este dispositivo
            </label>

            <button className="btn btn-primary btn-lg mt-6 w-full rounded-field" type="submit">
              Entrar
            </button>

            {submitted !== null ? (
              <div className="alert alert-success mt-5" role="status">
                <span>Correo: {submitted.email}</span>
                <span>Contraseña: {submitted.password}</span>
              </div>
            ) : null}

            <div className="my-6 flex items-center gap-3 text-meta text-base-content/50">
              <div className="h-px flex-1 bg-base-300" />
              o entra con
              <div className="h-px flex-1 bg-base-300" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="btn btn-outline flex-1" type="button">
                Google
              </button>
              <button className="btn btn-outline flex-1" type="button">
                Microsoft
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-base-content/70 lg:hidden">
              ¿Sin cuenta?{' '}
              <a className="font-semibold text-primary" href="#centro">
                Pídela a tu centro
              </a>
            </p>
          </form>
        </section>

        <footer className="mx-auto mt-10 flex w-full max-w-md flex-wrap gap-x-6 gap-y-2 text-meta text-base-content/55">
          <span>Privacidad</span>
          <span>Términos</span>
          <span>Ayuda</span>
          <span>© 2026 aTempo</span>
        </footer>
      </main>
    </div>
  )
}
