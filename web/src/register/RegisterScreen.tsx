import { FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
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

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (submit()) void navigate({ to: '/student/dashboard' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-box bg-base-100 p-4 md:p-8">
        <Link to="/" className="link w-fit">
          Inicia sesión
        </Link>
        <h1 className="text-2xl font-medium">Crea tu cuenta.</h1>
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
          <div className="flex flex-col gap-2">
            <label htmlFor="password">Contraseña</label>
            <div className="flex items-center gap-2">
              <input
                id="password"
                className={passwordError !== '' ? 'input input-error w-full' : 'input w-full'}
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                aria-invalid={passwordError !== ''}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="btn" type="button" onClick={() => setVisible((value) => !value)}>
                {visible ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {passwordError !== '' ? <p className="text-sm">{passwordError}</p> : null}
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
    <div className="flex flex-col gap-2">
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
      {props.error !== '' ? <p className="text-sm">{props.error}</p> : null}
    </div>
  )
}
