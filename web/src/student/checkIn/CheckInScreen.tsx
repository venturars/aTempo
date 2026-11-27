import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TextKey } from '../../lang/messages'
import { useText } from '../../lang/useText'
import { useSessionStore } from '../../session/sessionStore'
import { useFlashStore } from '../flashStore'
import { flowTopWithoutHeader } from '../flowLayout'
import { classCodeProblem, registerArrival, type CodeProblem } from '../studentAccounts'
import { rememberCheckIn } from './pendingCheckIn'

// Aquí llega el alumno al escanear el QR de clase con la cámara del móvil:
// /student/check-in?code=ATEMPO-CLASE-1109-123456
// El código se comprueba en el momento del escaneo.
// Con la sesión abierta, apunta la entrada. Sin sesión, guarda el escaneo y lleva a entrar.
// Qué se enseña si el QR no vale.
const problemText: Record<CodeProblem, { title: TextKey; body: TextKey }> = {
  expired: {
    title: 'checkIn.expired.title',
    body: 'checkIn.expired.body'
  },
  'wrong-class': {
    title: 'checkIn.wrongClass.title',
    body: 'checkIn.wrongClass.body'
  }
}

export function CheckInScreen({ code }: { code: string }): React.JSX.Element | null {
  const t = useText()
  const navigate = useNavigate()
  // En desarrollo, React ejecuta los efectos dos veces: cada código se atiende una sola vez.
  // Si llega otro enlace a la misma pantalla, el código cambia y se atiende de nuevo.
  const handledCode = useRef<string | null>(null)
  const [problem, setProblem] = useState<CodeProblem | null>(null)

  useEffect(() => {
    if (handledCode.current === code) return
    handledCode.current = code
    setProblem(null)

    const now = new Date()
    const codeProblem = classCodeProblem(code, now)
    if (codeProblem !== null) {
      setProblem(codeProblem)
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

  if (problem === null) return null

  return (
    <main
      className={`page-enter flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center ${flowTopWithoutHeader}`}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{t(problemText[problem].title)}</h1>
      <p className="max-w-xs text-base text-base-content/60">{t(problemText[problem].body)}</p>
      <Link
        className="btn btn-primary btn-lg mt-5 w-full max-w-xs"
        to="/student/scan"
        search={{ escribir: true }}
        replace
      >
        {t('checkIn.typeCode')}
      </Link>
    </main>
  )
}
