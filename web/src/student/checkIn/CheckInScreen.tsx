import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSessionStore } from '../../session/sessionStore'
import { useFlashStore } from '../flashStore'
import { flowTopWithoutHeader } from '../flowLayout'
import { classCodeProblem, registerArrival } from '../studentAccounts'
import { rememberCheckIn } from './pendingCheckIn'

// Aquí llega el alumno al escanear el QR de clase con la cámara del móvil:
// /student/check-in?code=ATEMPO-CLASE-1109-1234
// El código se comprueba en el momento del escaneo.
// Con la sesión abierta, apunta la entrada. Sin sesión, guarda el escaneo y lleva a entrar.
export function CheckInScreen({ code }: { code: string }): React.JSX.Element | null {
  const navigate = useNavigate()
  // En desarrollo, React ejecuta los efectos dos veces. La entrada se apunta una sola vez.
  const handled = useRef(false)
  const [codeIsBad, setCodeIsBad] = useState(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const now = new Date()
    if (classCodeProblem(code, now) !== null) {
      setCodeIsBad(true)
      return
    }
    if (useSessionStore.getState().email === null) {
      rememberCheckIn(now)
      void navigate({ to: '/', replace: true })
      return
    }
    const result = registerArrival(now)
    if (result.registered) {
      void navigate({ to: '/student/registered', replace: true })
      return
    }
    useFlashStore.getState().showFlash(result.message)
    void navigate({ to: '/student/dashboard', replace: true })
  }, [code, navigate])

  if (!codeIsBad) return null

  return (
    <main
      className={`page-enter flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center ${flowTopWithoutHeader}`}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Este QR ya no vale</h1>
      <p className="max-w-xs text-base text-base-content/60">
        Cambia cada 30 segundos. Escanéalo otra vez o escribe el código que hay debajo.
      </p>
      <Link
        className="btn btn-primary btn-lg mt-5 w-full max-w-xs"
        to="/student/scan"
        search={{ escribir: true }}
        replace
      >
        Escribir el código
      </Link>
    </main>
  )
}
