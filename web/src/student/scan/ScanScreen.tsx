import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { RequireStudent } from '../../session/RequireStudent'
import { flowTopBelowHeader } from '../flowLayout'
import { registerReading, type CheckInResult } from '../studentAccounts'

export function ScanScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readingRef = useRef(false)
  const [typedCode, setTypedCode] = useState('')
  // La cámara puede fallar sin que sea culpa de nadie: es una nota, no un error.
  const [cameraNote, setCameraNote] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  function stopCamera(): void {
    readingRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function finish(result: CheckInResult): void {
    if (!result.registered) {
      setCodeError(result.message)
      return
    }
    stopCamera()
    void navigate({ to: '/student/registered' })
  }

  async function watch(detector: BarcodeDetector): Promise<void> {
    if (!readingRef.current || videoRef.current === null) return
    if (videoRef.current.readyState >= 2) {
      const codes = await detector.detect(videoRef.current)
      const value = codes[0]?.rawValue
      if (value) {
        stopCamera()
        finish(registerReading(value))
        return
      }
    }
    requestAnimationFrame(() => void watch(detector))
  }

  async function startCamera(): Promise<void> {
    if (
      window.BarcodeDetector === undefined ||
      navigator.mediaDevices?.getUserMedia === undefined
    ) {
      setCameraNote('Este navegador no puede usar la cámara')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      readingRef.current = true
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      void watch(detector)
    } catch (caught) {
      stopCamera()
      const name = caught instanceof DOMException ? caught.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraNote('Sin permiso para la cámara')
        return
      }
      setCameraNote('No se pudo abrir la cámara')
    }
  }

  useEffect(() => {
    void startCamera()
    return stopCamera
  }, [])

  function onSubmitCode(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (typedCode.trim() === '') return
    finish(registerReading(typedCode))
  }

  return (
    <RequireStudent>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center px-4 sm:px-8">
          <Link className="btn btn-ghost btn-circle" to="/student/dashboard" aria-label="Cerrar">
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
          className={`page-enter flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16 text-center ${flowTopBelowHeader}`}
        >
          <h1 className="text-2xl font-semibold tracking-tight">Escanea el QR</h1>
          <div className="panel-card relative aspect-square w-full max-w-xs overflow-hidden rounded-box sm:aspect-[4/3] sm:max-w-md">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <ScanFrame dimmed={cameraNote !== null} />
            {cameraNote !== null ? <CameraNote text={cameraNote} /> : null}
          </div>
          <form className="field w-full max-w-xs text-left" noValidate onSubmit={onSubmitCode}>
            <label htmlFor="codigo-clase">Código de la clase</label>
            <div className="field-row">
              <input
                id="codigo-clase"
                className={codeError !== null ? 'input input-error w-full' : 'input w-full'}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={typedCode}
                aria-invalid={codeError !== null}
                onChange={(event) => {
                  setTypedCode(event.target.value)
                  setCodeError(null)
                }}
              />
              <button className="btn btn-primary" type="submit">
                Registrar
              </button>
            </div>
            {codeError !== null ? (
              <p className="text-sm text-error" role="alert">
                {codeError}
              </p>
            ) : null}
          </form>
        </main>
      </div>
    </RequireStudent>
  )
}

// Sin cámara, la nota va dentro del visor y el marco se apaga.
function CameraNote({ text }: { text: string }): React.JSX.Element {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
      role="status"
    >
      <span className="grid size-11 place-items-center rounded-full bg-base-200 text-base-content/60">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </span>
      <p className="max-w-60 text-sm text-base-content/70">{text}</p>
    </div>
  )
}

function ScanFrame({ dimmed }: { dimmed: boolean }): React.JSX.Element {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 m-auto h-56 w-56 text-primary ${dimmed ? 'opacity-15' : ''}`}
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
