import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { todayClass } from '../studentExample'
import { registerReading } from '../studentAccounts'

export function ScanScreen(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readingRef = useRef(false)
  const [reading, setReading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pin, setPin] = useState('')

  function stopCamera(): void {
    readingRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setReading(false)
  }

  useEffect(() => stopCamera, [])

  async function watch(detector: BarcodeDetector): Promise<void> {
    if (!readingRef.current || videoRef.current === null) return
    if (videoRef.current.readyState >= 2) {
      const codes = await detector.detect(videoRef.current)
      const value = codes[0]?.rawValue
      if (value) {
        stopCamera()
        setNotice(registerReading(value))
        return
      }
    }
    requestAnimationFrame(() => void watch(detector))
  }

  async function startCamera(): Promise<void> {
    setNotice(null)
    if (window.BarcodeDetector === undefined || navigator.mediaDevices?.getUserMedia === undefined) {
      setNotice('Este navegador no puede usar la cámara. Entra el código de 6 cifras.')
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
      setReading(true)
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      void watch(detector)
    } catch (error) {
      stopCamera()
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setNotice('No hay permiso para la cámara. Entra el código de 6 cifras.')
        return
      }
      setNotice('La cámara no está disponible. Entra el código de 6 cifras.')
    }
  }

  function onCode(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setNotice(registerReading(pin))
  }

  return (
    <main className="flex min-h-screen justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-5">
        <Link to="/student/dashboard" className="link w-fit">
          Volver
        </Link>
        <h1 className="text-2xl font-medium">Registrar asistencia</h1>
        <p>
          Hoy · {todayClass.label} · {todayClass.start}
        </p>
        <button className="btn btn-primary" type="button" onClick={() => void startCamera()}>
          Escanear
        </button>
        <video
          ref={videoRef}
          className={reading ? 'w-full rounded-box bg-base-300' : 'hidden'}
          muted
          playsInline
        />
        {reading ? (
          <button className="btn" type="button" onClick={stopCamera}>
            Cerrar cámara
          </button>
        ) : null}
        <form className="flex flex-col gap-3" onSubmit={onCode}>
          <label className="otp otp-lg w-full" htmlFor="class-pin">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <input
              id="class-pin"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-label="Código de la clase"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
          <button className="btn" type="submit">
            Usar código
          </button>
        </form>
        {notice !== null ? (
          <div className="alert" role="status">
            <span>{notice}</span>
          </div>
        ) : null}
      </section>
    </main>
  )
}
