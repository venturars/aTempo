import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { formatTime } from '../../lang/format'
import { useText } from '../../lang/useText'
import { statusForArrival, statusLabelKey, type AttendanceStatus } from '../attendanceStatus'
import { classDayLabel } from '../classDate'
import { NoStudentSession } from '../NoStudentSession'
import { useCurrentStudent, useStudentAccountsStore } from '../studentAccounts'
import {
  lateMinutes,
  sampleReadings,
  todayClass,
  type SampleReading,
  type StudentAccount
} from '../studentExample'

type ScanResult =
  | { kind: 'confirmed'; arrival: string; status: AttendanceStatus }
  | { kind: 'repeated'; arrival: string }
  | { kind: 'other' }

export function ScanScreen(): React.JSX.Element {
  const student = useCurrentStudent()
  if (student === null) {
    return <NoStudentSession />
  }
  return <StudentScan student={student} />
}

function StudentScan({ student }: { student: StudentAccount }): React.JSX.Element {
  const t = useText()
  const recordEntry = useStudentAccountsStore((state) => state.recordEntry)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [result, setResult] = useState<ScanResult | null>(null)

  function onReading(reading: SampleReading): void {
    dialogRef.current?.close()
    if (reading.code !== todayClass.code) {
      setResult({ kind: 'other' })
      return
    }
    const previous = student.history.find((entry) => entry.date === todayClass.date)
    if (previous) {
      setResult({ kind: 'repeated', arrival: previous.arrival ?? '' })
      return
    }
    const status = statusForArrival(reading.arrival, todayClass.start, lateMinutes)
    recordEntry(student.email, { date: todayClass.date, arrival: reading.arrival, status })
    setResult({ kind: 'confirmed', arrival: reading.arrival, status })
  }

  function resultText(shown: ScanResult): string {
    if (shown.kind === 'other') {
      return t('student.scan.otherClass')
    }
    const time = shown.arrival === '' ? '' : formatTime(shown.arrival)
    if (shown.kind === 'repeated') {
      return t('student.scan.alreadyRegistered', { time })
    }
    return t('student.scan.confirmed', { status: t(statusLabelKey[shown.status]), time })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-box bg-base-100 p-4 md:p-8">
        <Link to="/student/dashboard" className="link w-fit">
          {t('common.back')}
        </Link>
        <h1 className="text-3xl font-semibold text-base-content">{t('student.scan.title')}</h1>
        <p className="text-secondary">
          {t('student.scan.todayClass', {
            day: classDayLabel(todayClass.date),
            start: formatTime(todayClass.start)
          })}
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => dialogRef.current?.showModal()}
        >
          {t('student.scan.scan')}
        </button>
        {result && (
          <div role="status" className="alert">
            {resultText(result)}
          </div>
        )}
      </section>
      <dialog ref={dialogRef} className="modal" aria-labelledby="reader-title">
        <div className="modal-box w-full max-w-sm">
          <h2 id="reader-title" className="text-lg font-semibold">
            {t('student.scan.reader.title')}
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {sampleReadings.map((reading) => (
              <button
                key={`${reading.labelKey}-${reading.arrival}`}
                className="btn w-full"
                type="button"
                onClick={() => onReading(reading)}
              >
                {t(reading.labelKey, { time: formatTime(reading.arrival) })}
              </button>
            ))}
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{t('common.close')}</button>
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
