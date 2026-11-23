import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '../shared/ThemeToggle'
import { useAdminAccounts, type SignUpErrors, type SignUpInput } from './adminAccounts'

type Mode = 'login' | 'sign-up'

export function AdminEntry({
  dark,
  onTheme
}: {
  dark: boolean
  onTheme: () => void
}): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('login')

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold">aTempo</p>
          <ThemeToggle dark={dark} onToggle={onTheme} />
        </div>
        {mode === 'login' ? (
          <LoginForm onSignUp={() => setMode('sign-up')} />
        ) : (
          <SignUpForm onLogin={() => setMode('login')} />
        )}
        <Link className="link w-fit text-sm" to="/">
          Volver al acceso del alumno
        </Link>
      </section>
    </main>
  )
}

function LoginForm({ onSignUp }: { onSignUp: () => void }): React.JSX.Element {
  const logIn = useAdminAccounts((state) => state.logIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = logIn(email, password)
    if (!result.ok) setError(result.error)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Administración</h1>
        <p className="text-base-content/65">
          Entra para gestionar personas, cursos y sesiones de tu organización.
        </p>
      </div>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="admin-email">Correo</label>
          <input
            id="admin-email"
            className="input w-full"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            className="input w-full"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
        {error !== '' ? (
          <div className="alert alert-soft alert-error" role="alert">
            <span>{error}</span>
          </div>
        ) : null}
      </form>
      <p className="text-sm text-base-content/60">
        ¿Tu organización aún no usa aTempo?{' '}
        <button type="button" className="link link-primary font-medium" onClick={onSignUp}>
          Crear cuenta
        </button>
      </p>
    </>
  )
}

const emptySignUp: SignUpInput = {
  organizationName: '',
  taxId: '',
  firstName: '',
  lastName: '',
  identificationDocument: '',
  email: '',
  password: ''
}

const fields: {
  key: keyof SignUpInput
  label: string
  type?: string
  autoComplete?: string
  hint?: string
}[] = [
  { key: 'organizationName', label: 'Nombre de la organización', autoComplete: 'organization' },
  { key: 'taxId', label: 'CIF' },
  { key: 'firstName', label: 'Nombre', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Apellidos', autoComplete: 'family-name' },
  { key: 'identificationDocument', label: 'Documento de identidad', hint: 'DNI, NIE o pasaporte.' },
  { key: 'email', label: 'Correo', type: 'email', autoComplete: 'email' },
  {
    key: 'password',
    label: 'Contraseña',
    type: 'password',
    autoComplete: 'new-password',
    hint: 'Al menos 8 caracteres.'
  }
]

function SignUpForm({ onLogin }: { onLogin: () => void }): React.JSX.Element {
  const signUp = useAdminAccounts((state) => state.signUp)
  const [form, setForm] = useState<SignUpInput>(emptySignUp)
  const [errors, setErrors] = useState<SignUpErrors>({})

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = signUp(form)
    if (!result.ok) setErrors(result.errors)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Crea la cuenta de tu organización</h1>
        <p className="text-base-content/65">
          Serás su administrador. Después invitas a profesores y alumnos.
        </p>
      </div>
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        {fields.map((field) => {
          const error = errors[field.key]
          const describedBy = error
            ? `sign-up-${field.key}-error`
            : field.hint
              ? `sign-up-${field.key}-hint`
              : undefined
          return (
            <div className="field" key={field.key}>
              <label htmlFor={`sign-up-${field.key}`}>{field.label}</label>
              <input
                id={`sign-up-${field.key}`}
                className={error ? 'input input-error w-full' : 'input w-full'}
                type={field.type ?? 'text'}
                autoComplete={field.autoComplete ?? 'off'}
                value={form[field.key]}
                aria-invalid={error !== undefined}
                aria-describedby={describedBy}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              />
              {error ? (
                <p id={`sign-up-${field.key}-error`} className="text-sm text-error">
                  {error}
                </p>
              ) : field.hint ? (
                <p id={`sign-up-${field.key}-hint`} className="text-sm text-base-content/60">
                  {field.hint}
                </p>
              ) : null}
            </div>
          )
        })}
        <button className="btn btn-primary" type="submit">
          Crear cuenta
        </button>
      </form>
      <p className="text-sm text-base-content/60">
        ¿Ya tienes cuenta?{' '}
        <button type="button" className="link link-primary font-medium" onClick={onLogin}>
          Entrar
        </button>
      </p>
    </>
  )
}
