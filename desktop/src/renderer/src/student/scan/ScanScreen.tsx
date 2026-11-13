import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { statusForArrival, statusLabel } from '../attendanceStatus'
import { useCurrentStudent, useStudentAccountsStore } from '../studentAccounts'
import { lateMinutes, sampleReadings, todayClass, type SampleReading } from '../studentExample'

type ScanResult =
  { kind: 'confirmed' | 'repeated'; arrival: string; text: string } | { kind: 'other' }

export function ScanScreen(): React.JSX.Element {
  const student = useCurrentStudent()
  const recordEntry = useStudentAccountsStore((state) => state.recordEntry)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [result, setResult] = useState<ScanResult | null>(null)

  function onReading(reading: SampleReading): void {
    dialogRef.current?.close()
    if (reading.code !== todayClass.code) {
      setResult({ kind: 'other' })
      return
    }
    const previous = student.history.find((entry) => entry.label === todayClass.label)
    if (previous) {
      setResult({
        kind: 'repeated',
        arrival: previous.arrival ?? '',
        text: `Ya registraste tu entrada a las ${previous.arrival}.`
      })
      return
    }
    const status = statusForArrival(reading.arrival, todayClass.start, lateMinutes)
    recordEntry(student.email, { label: todayClass.label, arrival: reading.arrival, status })
    setResult({
      kind: 'confirmed',
      arrival: reading.arrival,
      text: `${statusLabel[status]} · ${reading.arrival}`
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-box bg-base-100 p-4 md:p-8">
        <Link to="/student/dashboard" className="link w-fit">
          Volver
        </Link>
        <h1 className="text-3xl font-semibold text-base-content">Registrar asistencia</h1>
        <p className="text-secondary">
          Clase de hoy: {todayClass.label}, {todayClass.start}
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => dialogRef.current?.showModal()}
        >
          Escanear
        </button>
        {result && (
          <div role="status" className="alert">
            {result.kind === 'other' ? 'Este código no es de esta clase.' : result.text}
          </div>
        )}
      </section>
      <dialog ref={dialogRef} className="modal" aria-labelledby="reader-title">
        <div className="modal-box w-full max-w-sm">
          <h2 id="reader-title" className="text-lg font-semibold">
            Lector
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {sampleReadings.map((reading) => (
              <button
                key={reading.label}
                className="btn w-full"
                type="button"
                onClick={() => onReading(reading)}
              >
                {reading.label}
              </button>
            ))}
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Cerrar</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button tabIndex={-1} aria-hidden="true" />
        </form>
      </dialog>
    </main>
  )
}
