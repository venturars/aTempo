import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TextKey } from '../../language/messages'
import { useText } from '../../language/useText'
import { RequireStudent } from '../../session/RequireStudent'
import { flowTopBelowHeader } from '../flowLayout'
import { registerReading, type CheckInResult } from '../studentAccounts'
import { messageText, type StudentMessage } from '../studentMessage'

// La pantalla tiene dos modos:
//   scan → la cámara lee el QR. Es lo principal.
//   code → el alumno escribe las 6 cifras que hay debajo del QR. Es el plan B.
// Se pasa a «code» con «Escribir el código», si la cámara no está disponible o si la lectura falla.
// Desde «code» se vuelve a «scan» con «Escanear el QR».
type Mode = 'scan' | 'code'

// Safari no sabe leer QR desde una página web, y sin https no hay cámara.
function browserCanScan(): boolean {
  return window.BarcodeDetector !== undefined && navigator.mediaDevices?.getUserMedia !== undefined
}

// Si la cámara falla, se dice qué ha pasado y qué puede hacer el alumno. El campo del código sigue ahí.
// Se guarda la clave del texto; la pantalla lo traduce al pintarlo.
const browserCannotScan: TextKey = 'scan.camera.unsupported'

function cameraProblemFor(caught: unknown): TextKey {
  const name = caught instanceof DOMException ? caught.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'scan.camera.notAllowed'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'scan.camera.notFound'
  if (name === 'NotReadableError') return 'scan.camera.inUse'
  return 'scan.camera.failed'
}

// Primero se comprueba la sesión: sin ella, se va al login sin pedir la cámara.
export function ScanScreen({
  startWithCode = false
}: {
  startWithCode?: boolean
}): React.JSX.Element {
  return (
    <RequireStudent>
      <ScanView startWithCode={startWithCode} />
    </RequireStudent>
  )
}

function ScanView({ startWithCode }: { startWithCode: boolean }): React.JSX.Element {
  const t = useText()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readingRef = useRef(false)
  const [canScan] = useState(browserCanScan)
  const [mode, setMode] = useState<Mode>(startWithCode || !canScan ? 'code' : 'scan')
  const [typedCode, setTypedCode] = useState('')
  const [cameraProblem, setCameraProblem] = useState<TextKey | null>(
    canScan ? null : browserCannotScan
  )
  const [codeError, setCodeError] = useState<StudentMessage | null>(null)
  // El campo se enfoca solo cuando el alumno lo pide, para no abrir el teclado sin querer.
  const [focusCode, setFocusCode] = useState(startWithCode)

  function stopCamera(): void {
    readingRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function finish(result: CheckInResult): void {
    if (!result.registered) {
      setCodeError(result.message)
      setMode('code')
      return
    }
    stopCamera()
    void navigate({ to: '/student/registered' })
  }

  async function watch(detector: BarcodeDetector): Promise<void> {
    if (!readingRef.current || videoRef.current === null) return
    if (videoRef.current.readyState >= 2) {
      let value: string | undefined
      try {
        const codes = await detector.detect(videoRef.current)
        value = codes[0]?.rawValue
      } catch {
        // Un fotograma que no se puede leer no para el escáner: se prueba con el siguiente.
      }
      // Mientras se leía, el alumno pudo cambiar a escribir el código o salir.
      if (!readingRef.current) return
      if (value) {
        stopCamera()
        finish(registerReading(value))
        return
      }
    }
    requestAnimationFrame(() => void watch(detector))
  }

  // `isCancelled` dice si el alumno ya salió del modo «scan» mientras la cámara arrancaba
  // (en desarrollo, React también monta, desmonta y vuelve a montar al empezar).
  // Entonces se apaga la cámara que acaba de llegar y no se enseña ninguna nota.
  async function startCamera(isCancelled: () => boolean): Promise<void> {
    if (window.BarcodeDetector === undefined) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (isCancelled()) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (isCancelled()) return
      readingRef.current = true
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      void watch(detector)
    } catch (caught) {
      if (isCancelled()) return
      stopCamera()
      setCameraProblem(cameraProblemFor(caught))
      setMode('code')
    }
  }

  // La cámara solo está encendida en el modo «scan».
  useEffect(() => {
    if (mode !== 'scan') return
    let cancelled = false
    void startCamera(() => cancelled)
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [mode])

  function onSubmitCode(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (typedCode.trim() === '') return
    finish(registerReading(typedCode))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Link
          className="btn btn-ghost btn-circle"
          to="/student/dashboard"
          aria-label={t('common.close')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>
      <main
        key={mode}
        className={`page-enter flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16 text-center ${flowTopBelowHeader}`}
      >
        {mode === 'scan' ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">{t('scan.scanTitle')}</h1>
            <div className="panel-card relative aspect-square w-full max-w-xs overflow-hidden rounded-box sm:aspect-[4/3] sm:max-w-md">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <ScanFrame />
            </div>
            <button
              className="btn btn-ghost text-base font-medium text-primary"
              type="button"
              onClick={() => {
                setFocusCode(true)
                setMode('code')
              }}
            >
              {t('scan.typeCode')}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{t('scan.codeTitle')}</h1>
              <p className="max-w-xs text-base text-base-content/60">{t('scan.codeHint')}</p>
            </div>
            {cameraProblem !== null ? <CameraProblem text={t(cameraProblem)} /> : null}
            <form className="field w-full max-w-xs text-left" noValidate onSubmit={onSubmitCode}>
              <label className="sr-only" htmlFor="codigo-clase">
                {t('scan.codeLabel')}
              </label>
              <div className="field-row">
                <input
                  id="codigo-clase"
                  className={`input w-full text-center text-lg tabular-nums tracking-[0.3em] ${codeError !== null ? 'input-error' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus={focusCode}
                  value={typedCode}
                  aria-invalid={codeError !== null}
                  onChange={(event) => {
                    setTypedCode(event.target.value)
                    setCodeError(null)
                  }}
                />
                <button className="btn btn-primary" type="submit">
                  {t('scan.register')}
                </button>
              </div>
              {codeError !== null ? (
                <p className="text-sm text-error" role="alert">
                  {messageText(codeError)}
                </p>
              ) : null}
            </form>
            {canScan ? (
              <button
                className="btn btn-ghost text-base font-medium text-primary"
                type="button"
                onClick={() => {
                  setCodeError(null)
                  setCameraProblem(null)
                  setMode('scan')
                }}
              >
                {t('scan.scanAgain')}
              </button>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}

// Aviso de la cámara: dice qué ha pasado. Con estilo suave de aviso, no de error del alumno.
function CameraProblem({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="alert alert-soft alert-warning w-full max-w-xs text-left" role="alert">
      <svg
        className="size-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M9.5 5H15l2 2h2a2 2 0 0 1 2 2v8.5M18.5 19H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
        <path d="M9.9 10.1a3.5 3.5 0 0 0 4.9 4.9" />
      </svg>
      <span className="text-sm">{text}</span>
    </div>
  )
}

function ScanFrame(): React.JSX.Element {
  return (
    <svg
      className="pointer-events-none absolute inset-0 m-auto h-56 w-56 text-primary"
      viewBox="0 0 264 264"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 56V30A28 28 0 0 1 30 2h26" />
      <path d="M208 2h26a28 28 0 0 1 28 28v26" />
      <path d="M262 208v26a28 28 0 0 1-28 28h-26" />
      <path d="M56 262H30a28 28 0 0 1-28-28v-26" />
    </svg>
  )
}
