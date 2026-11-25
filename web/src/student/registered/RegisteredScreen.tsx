import { useEffect } from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { formatTime } from '../../language/format'
import { useText } from '../../language/useText'
import { RequireStudent } from '../../session/RequireStudent'
import { flowTopWithoutHeader } from '../flowLayout'
import { Tempito } from '../mascot/Tempito'
import { useCurrentStudent } from '../studentAccounts'
import { dateKey } from '../studentDate'
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
  const t = useText()
  const student = useCurrentStudent()
  const todayDate = dateKey(new Date())
  const today = student.history.find((entry) => entry.date === todayDate)
  const arrival = today?.arrival ?? null

  // Al llegar a esta pantalla con la entrada de hoy, confeti. Al salir, se para.
  useEffect(() => {
    if (arrival !== null) return fireSideCannons()
  }, [arrival])

  // Sin entrada de hoy no hay nada que celebrar: vuelve al inicio.
  if (arrival === null) return <Navigate to="/student/dashboard" replace />

  return (
    <main
      className={`page-enter flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center ${flowTopWithoutHeader}`}
    >
      <Tempito mood="happy" className="mb-1 w-44 sm:w-48" />
      <h1 className="text-2xl font-semibold tracking-tight">{t('registered.title')}</h1>
      <p className="text-base text-base-content/60">
        {t('registered.arrivedAt')}{' '}
        <span className="font-medium tabular-nums text-base-content">{formatTime(arrival)}</span>
      </p>
      <Link className="btn btn-primary btn-lg mt-5 w-full max-w-xs" to="/student/dashboard">
        {t('registered.backHome')}
      </Link>
    </main>
  )
}
