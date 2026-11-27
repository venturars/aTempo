import { FormEvent, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { formatTime } from '../../lang/format'
import type { TextKey } from '../../lang/messages'
import { useText } from '../../lang/useText'
import { StudentLayout } from '../StudentLayout'
import { useFlashStore } from '../flashStore'
import { useCurrentStudent } from '../studentAccounts'
import { todayClass } from '../studentExample'
import { dateKey, minutesOfDay } from '../studentDate'
import { DayField } from './DayField'
import { TimeField } from './TimeField'
import { saveNotice, type NoticeKind } from './studentNotices'

const kinds: { id: NoticeKind; labelKey: TextKey; icon: React.JSX.Element }[] = [
  {
    id: 'retraso',
    labelKey: 'notice.kind.late',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  },
  {
    id: 'ausencia',
    labelKey: 'notice.kind.absent',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18M10 14l4 4m0-4l-4 4" />
      </svg>
    )
  }
]

export function NoticeScreen(): React.JSX.Element {
  const t = useText()
  const navigate = useNavigate()
  const student = useCurrentStudent()
  const showFlash = useFlashStore((state) => state.showFlash)
  const [kind, setKind] = useState<NoticeKind>('retraso')
  const [day, setDay] = useState(() => new Date())
  const [arrival, setArrival] = useState('')
  const [reason, setReason] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [error, setError] = useState<TextKey | ''>('')

  function chooseKind(next: NoticeKind): void {
    setKind(next)
    setError('')
  }

  function chooseArrival(next: string): void {
    setArrival(next)
    setError('')
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!todayClass.weekdays.includes(day.getDay())) {
      setError('notice.errors.noClassThatDay')
      return
    }
    if (kind === 'retraso' && arrival === '') {
      setError('notice.errors.arrivalMissing')
      return
    }
    if (kind === 'retraso' && minutesOfDay(arrival) <= minutesOfDay(todayClass.start)) {
      setError('notice.errors.beforeStart')
      return
    }
    if (kind === 'retraso' && minutesOfDay(arrival) >= minutesOfDay(todayClass.end)) {
      setError('notice.errors.afterEnd')
      return
    }
    saveNotice({
      email: student.email,
      kind,
      date: dateKey(day),
      arrival: kind === 'retraso' ? arrival : '',
      reason: reason.trim(),
      attachmentName: documentName
    })
    showFlash({ key: 'notice.sent' })
    void navigate({ to: '/student/dashboard' })
  }

  const errorText = error === '' ? '' : t(error, { time: formatTime(todayClass.start) })

  return (
    <StudentLayout>
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">{t('notice.title')}</h1>
        <form className="flex flex-col gap-6" noValidate onSubmit={onSubmit}>
          <div className="segment" role="group" aria-label={t('notice.kindGroup')}>
            {kinds.map((option) => (
              <button
                key={option.id}
                className="btn"
                type="button"
                aria-pressed={kind === option.id}
                onClick={() => chooseKind(option.id)}
              >
                {option.icon}
                {t(option.labelKey)}
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="dia">{t('notice.day')}</label>
            <DayField id="dia" day={day} onChange={setDay} />
          </div>
          {kind === 'retraso' ? (
            <ArrivalField arrival={arrival} error={errorText} onChange={chooseArrival} />
          ) : null}
          <div className="field">
            <label htmlFor="motivo">
              {t('notice.reason')} <span className="field-optional">{t('notice.optional')}</span>
            </label>
            <textarea
              id="motivo"
              className="textarea w-full"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <DocumentField name={documentName} onChange={setDocumentName} />
          <button className="btn btn-primary mt-2 w-full" type="submit">
            {t('notice.send')}
          </button>
        </form>
      </div>
    </StudentLayout>
  )
}

// Si la hora está a medias, el campo da un valor vacío y el aviso pide la hora.
function ArrivalField({
  arrival,
  error,
  onChange
}: {
  arrival: string
  error: string
  onChange: (arrival: string) => void
}): React.JSX.Element {
  const t = useText()
  return (
    <div className="field">
      <label htmlFor="hora-llegada">{t('notice.arrival')}</label>
      <TimeField id="hora-llegada" value={arrival} invalid={error !== ''} onChange={onChange} />
      {error !== '' ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

// El input de archivo está oculto. Un botón con aspecto de campo lo abre, y se puede usar con el teclado.
function DocumentField({
  name,
  onChange
}: {
  name: string
  onChange: (name: string) => void
}): React.JSX.Element {
  const t = useText()
  const fileInput = useRef<HTMLInputElement>(null)

  function remove(): void {
    onChange('')
    if (fileInput.current !== null) fileInput.current.value = ''
  }

  return (
    <div className="field">
      <label htmlFor="attachment">
        {t('notice.document')} <span className="field-optional">{t('notice.optional')}</span>
      </label>
      <div className="field-row">
        <button
          id="attachment"
          className="input field-button"
          type="button"
          data-empty={name === '' ? '' : undefined}
          onClick={() => fileInput.current?.click()}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            {name === '' ? (
              <path d="M12 5v14M5 12h14" />
            ) : (
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
            )}
          </svg>
          <span className="field-button-value">{name === '' ? t('notice.addDocument') : name}</span>
        </button>
        {name !== '' ? (
          <button className="btn btn-ghost shrink-0" type="button" onClick={remove}>
            {t('notice.removeDocument')}
          </button>
        ) : null}
      </div>
      <input
        ref={fileInput}
        className="hidden"
        type="file"
        accept="image/*,.pdf"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')}
      />
    </div>
  )
}
