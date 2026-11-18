import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { RequireStudent } from '../../session/RequireStudent'
import { flowTopWithoutHeader } from '../flowLayout'
import { Tempito } from '../mascot/Tempito'
import { useCurrentStudent } from '../studentAccounts'
import { formatDay } from '../studentDate'
import { fireSideCannons } from './celebrate'

// Primero se comprueba la sesión: sin ella, se va al login sin lanzar el confeti.
export function RegisteredScreen(): React.JSX.Element {
  return (
    <RequireStudent>
      <RegisteredView />
    </RequireStudent>
  )
}

function RegisteredView(): React.JSX.Element {
  const student = useCurrentStudent()
  const todayLabel = formatDay(new Date())
  const today = student.history.find((entry) => entry.label === todayLabel)
  const arrival = today?.arrival ?? null

  // Al llegar a esta pantalla, confeti. Al salir, se para.
  useEffect(() => fireSideCannons(), [])

  return (
    <main
      className={`page-enter flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center ${flowTopWithoutHeader}`}
    >
      <Tempito mood="happy" className="mb-1 w-44 sm:w-48" />
      <h1 className="text-2xl font-semibold tracking-tight">¡Disfruta la clase!</h1>
      {arrival !== null ? (
        <p className="text-base text-base-content/60">
          Has entrado a las{' '}
          <span className="font-medium tabular-nums text-base-content">{arrival}</span>
        </p>
      ) : null}
      <Link className="btn btn-primary btn-lg mt-5 w-full max-w-xs" to="/student/dashboard">
        Volver al inicio
      </Link>
    </main>
  )
}
