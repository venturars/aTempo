import { FormEvent } from 'react'
import { ClaimPanel } from '../components/ClaimPanel'
import { useRegisterStore } from './registerStore'

export function RegisterScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:flex-row">
      <ClaimPanel />
      <RegisterForm />
    </main>
  )
}

function inputClass(error: string): string {
  return error !== '' ? 'input input-error w-full' : 'input w-full'
}

function RegisterForm(): React.JSX.Element {
  const name = useRegisterStore((state) => state.name)
  const email = useRegisterStore((state) => state.email)
  const password = useRegisterStore((state) => state.password)
  const passwordVisible = useRegisterStore((state) => state.passwordVisible)
  const nameError = useRegisterStore((state) => state.nameError)
  const emailError = useRegisterStore((state) => state.emailError)
  const passwordError = useRegisterStore((state) => state.passwordError)
  const submitted = useRegisterStore((state) => state.submitted)
  const setName = useRegisterStore((state) => state.setName)
  const setEmail = useRegisterStore((state) => state.setEmail)
  const setPassword = useRegisterStore((state) => state.setPassword)
  const togglePasswordVisible = useRegisterStore((state) => state.togglePasswordVisible)
  const submit = useRegisterStore((state) => state.submit)

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    submit()
  }

  return (
    <section
      className="flex w-full max-w-md flex-col gap-8 rounded-box bg-base-100 p-8"
      aria-labelledby="register-title"
    >
      <div className="flex flex-col gap-2">
        <h2 id="register-title" className="text-2xl font-medium">
          Crea tu cuenta
        </h2>
        <p>Empieza a gestionar tu clase en menos de un minuto.</p>
      </div>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-base-content" htmlFor="name">
            Nombre completo
          </label>
          <input
            id="name"
            className={inputClass(nameError)}
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Tu nombre"
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
            className={inputClass(emailError)}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nombre@ejemplo.com"
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
          <div className="join w-full">
            <input
              id="password"
              className={`${inputClass(passwordError)} join-item`}
              type={passwordVisible ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              aria-invalid={passwordError !== ''}
              aria-describedby={passwordError !== '' ? 'password-error' : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="btn join-item"
              type="button"
              aria-controls="password"
              aria-pressed={passwordVisible}
              onClick={togglePasswordVisible}
            >
              {passwordVisible ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {passwordError !== '' ? (
            <p id="password-error" className="text-sm text-base-content">
              {passwordError}
            </p>
          ) : null}
        </div>
        <button className="btn btn-primary" type="submit">
          Crear mi cuenta
        </button>
        {submitted !== null ? (
          <div className="alert alert-success" role="status">
            <span>
              Cuenta creada para {submitted.name} ({submitted.email}).
            </span>
          </div>
        ) : null}
      </form>
    </section>
  )
}
