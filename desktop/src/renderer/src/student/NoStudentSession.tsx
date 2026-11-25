import { Link } from '@tanstack/react-router'
import { useText } from '../language/useText'

// Se muestra cuando la sesión abierta no es de un alumno con cuenta.
export function NoStudentSession(): React.JSX.Element {
  const t = useText()
  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-4 rounded-box bg-base-100 p-4 md:p-8">
        <h1 className="text-xl font-medium text-base-content">{t('student.noSession.title')}</h1>
        <p className="text-secondary">{t('student.noSession.body')}</p>
        <Link to="/" className="btn btn-primary w-fit">
          {t('student.noSession.goToLogin')}
        </Link>
      </section>
    </main>
  )
}
