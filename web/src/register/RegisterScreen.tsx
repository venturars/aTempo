import { FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { destinationAfterSignIn } from '../student/checkIn/pendingCheckIn'
import { useFlashStore } from '../student/flashStore'
import { useRegisterStore } from './registerStore'

export function RegisterScreen(): React.JSX.Element {
  const name = useRegisterStore((state) => state.name)
  const email = useRegisterStore((state) => state.email)
  const password = useRegisterStore((state) => state.password)
  const repeatPassword = useRegisterStore((state) => state.repeatPassword)
  const nameError = useRegisterStore((state) => state.nameError)
  const emailError = useRegisterStore((state) => state.emailError)
  const passwordError = useRegisterStore((state) => state.passwordError)
  const repeatPasswordError = useRegisterStore((state) => state.repeatPasswordError)
  const setName = useRegisterStore((state) => state.setName)
  const setEmail = useRegisterStore((state) => state.setEmail)
  const setPassword = useRegisterStore((state) => state.setPassword)
  const setRepeatPassword = useRegisterStore((state) => state.setRepeatPassword)
  const submit = useRegisterStore((state) => state.submit)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const showFlash = useFlashStore((state) => state.showFlash)

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!submit()) return
    // Si venía del QR de clase, la entrada queda apuntada y va a la pantalla de entrada,
    // que ya celebra. Si no, la bienvenida sale en el inicio, salvo que ya haya otro aviso.
    const destination = destinationAfterSignIn()
    if (destination === '/student/dashboard' && useFlashStore.getState().message === null) {
      showFlash('¡Te damos la bienvenida a aTempo!')
    }
    void navigate({ to: destination })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 md:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold tracking-tight">aTempo</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
            <p className="text-sm text-base-content/60">Solo te lleva un minuto.</p>
          </div>
        </div>
        <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
          <Field
            id="name"
            label="Nombre completo"
            type="text"
            value={name}
            error={nameError}
            autoComplete="name"
            onChange={setName}
          />
          <Field
            id="email"
            label="Correo electrónico"
            type="email"
            value={email}
            error={emailError}
            autoComplete="email"
            onChange={setEmail}
          />
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="field-row">
              <input
                id="password"
                className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                aria-invalid={passwordError !== ''}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="btn btn-ghost shrink-0"
                type="button"
                aria-pressed={visible}
                onClick={() => setVisible((value) => !value)}
              >
                {visible ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {passwordError !== '' ? <p className="text-sm text-error">{passwordError}</p> : null}
          </div>
          <Field
            id="repeat-password"
            label="Repetir contraseña"
            type="password"
            value={repeatPassword}
            error={repeatPasswordError}
            autoComplete="new-password"
            onChange={setRepeatPassword}
          />
          <button className="btn btn-primary" type="submit">
            Crear mi cuenta
          </button>
        </form>
        <p className="text-center text-sm text-base-content/60">
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="link link-primary font-medium">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  )
}

function Field(props: {
  id: string
  label: string
  type: string
  value: string
  error: string
  autoComplete: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        className={props.error !== '' ? 'input input-error w-full' : 'input w-full'}
        type={props.type}
        autoComplete={props.autoComplete}
        value={props.value}
        aria-invalid={props.error !== ''}
        onChange={(event) => props.onChange(event.target.value)}
      />
      {props.error !== '' ? <p className="text-sm text-error">{props.error}</p> : null}
    </div>
  )
}
