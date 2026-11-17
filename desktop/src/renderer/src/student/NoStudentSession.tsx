import { Link } from '@tanstack/react-router'

// Se muestra cuando la sesión abierta no es de un alumno con cuenta.
export function NoStudentSession(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-4 rounded-box bg-base-100 p-4 md:p-8">
        <h1 className="text-xl font-medium text-base-content">No hay una sesión de alumno</h1>
        <p className="text-secondary">
          Esta pantalla es para alumnos. Entra con una cuenta de alumno.
        </p>
        <Link to="/" className="btn btn-primary w-fit">
          Ir al login
        </Link>
      </section>
    </main>
  )
}
