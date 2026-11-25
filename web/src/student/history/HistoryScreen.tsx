import { Link } from '@tanstack/react-router'
import { formatNumber, formatTime } from '../../language/format'
import type { TextKey } from '../../language/messages'
import { text, useText } from '../../language/useText'
import { statusBadgeClass, statusLabelKey } from '../attendanceStatus'
import { StudentLayout } from '../StudentLayout'
import { useCurrentStudent } from '../studentAccounts'
import { dateFromKey, formatShortDate, weekdayName } from '../studentDate'
import { type ClassEntry } from '../studentExample'
import { readNoticesFor, type NoticeKind, type StudentNotice } from '../notice/studentNotices'

const noticeLabelKey: Record<NoticeKind, TextKey> = {
  retraso: 'history.noticeKind.late',
  ausencia: 'history.noticeKind.absent'
}

// Llegar tarde cuenta como asistencia. «89 %» en español, «89%» en inglés.
// Solo se llama al pintar, para que siga el idioma elegido.
function attendancePercent(history: ClassEntry[]): string {
  if (history.length === 0) return '—'
  const attended = history.filter((entry) => entry.status !== 'ausente').length
  const value = formatNumber(Math.round((attended / history.length) * 100))
  return text('history.percent', { value })
}

export type HistoryFixture = 'carga' | 'vacio' | 'error'

export function HistoryScreen({ fixture }: { fixture?: HistoryFixture }): React.JSX.Element {
  const t = useText()
  return (
    <StudentLayout>
      <h1 className="text-2xl font-semibold tracking-tight">{t('history.title')}</h1>
      {fixture === 'carga' ? (
        <p className="panel-card rounded-box flex items-center gap-3 p-5" role="status">
          <span className="loading loading-spinner motion-reduce:animate-none" aria-hidden="true" />
          {t('history.loading')}
        </p>
      ) : fixture === 'error' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="alert alert-soft alert-error min-w-0 flex-1" role="alert">
            {t('history.loadError')}
          </p>
          <Link className="btn btn-ghost" to="/student/history" search={{}}>
            {t('history.retry')}
          </Link>
        </div>
      ) : (
        <HistoryContent empty={fixture === 'vacio'} />
      )}
    </StudentLayout>
  )
}

function HistoryContent({ empty }: { empty: boolean }): React.JSX.Element {
  const t = useText()
  const student = useCurrentStudent()
  const history = empty ? [] : student.history
  const notices = empty ? [] : readNoticesFor(student.email)
  const late = history.filter((entry) => entry.status === 'tarde').length
  const absent = history.filter((entry) => entry.status === 'ausente').length

  return (
    <>
      <section className="panel-card rounded-box" aria-label={t('history.totals')}>
        <dl className="grid grid-cols-3 divide-x">
          <Stat label={t('history.attendance')} value={attendancePercent(history)} />
          <Stat label={t('history.lateCount')} value={formatNumber(late)} />
          <Stat label={t('history.absentCount')} value={formatNumber(absent)} />
        </dl>
      </section>
      <TableCard title={t('history.classes')}>
        {history.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-base-content/60">{t('history.empty')}</p>
        ) : (
          <table className="table panel-table table-fixed">
            <TableColumns />
            <thead>
              <tr>
                <th scope="col">{t('history.column.date')}</th>
                <th scope="col">{t('history.column.arrival')}</th>
                <th scope="col">{t('history.column.status')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <HistoryRow key={entry.date} entry={entry} />
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
      {notices.length > 0 ? (
        <TableCard title={t('history.notices')}>
          <table className="table panel-table table-fixed">
            <TableColumns />
            <thead>
              <tr>
                <th scope="col">{t('history.column.date')}</th>
                <th scope="col">{t('history.column.kind')}</th>
                <th scope="col">{t('history.column.detail')}</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice, index) => (
                <NoticeRow key={`${notice.date}-${index}`} notice={notice} />
              ))}
            </tbody>
          </table>
        </TableCard>
      ) : null}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="border-hairline flex flex-col gap-1 px-4 py-4 sm:px-5">
      <dt className="text-meta text-base-content/60">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  )
}

function TableCard({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="panel-card overflow-hidden rounded-box">
      <h2 className="px-5 pt-5 pb-3 text-lg font-medium">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

// Las dos tablas reparten igual el ancho, así las columnas caen en el mismo sitio.
function TableColumns(): React.JSX.Element {
  return (
    <colgroup>
      <col className="w-[44%]" />
      <col className="w-[24%]" />
      <col className="w-[32%]" />
    </colgroup>
  )
}

// date es «2026-11-11»: se ve «11 nov» y, en pantallas anchas, «Miércoles».
function DateCell({ date }: { date: string }): React.JSX.Element {
  // Vuelve a pintar la fecha al cambiar el idioma.
  useText()
  const day = dateFromKey(date)
  return (
    <td>
      <span className="font-medium">{formatShortDate(day)}</span>
      <span className="ml-2 hidden text-base-content/50 sm:inline">{weekdayName(day)}</span>
    </td>
  )
}

function HistoryRow({ entry }: { entry: ClassEntry }): React.JSX.Element {
  const t = useText()
  return (
    <tr>
      <DateCell date={entry.date} />
      <td className="tabular-nums text-base-content/70">
        {entry.arrival === null ? (
          <span className="text-base-content/35">—</span>
        ) : (
          formatTime(entry.arrival)
        )}
      </td>
      <td>
        <span className={statusBadgeClass(entry.status)}>{t(statusLabelKey[entry.status])}</span>
      </td>
    </tr>
  )
}

// Solo se llama al pintar, para que siga el idioma elegido.
function noticeDetail(notice: StudentNotice): string {
  const parts: string[] = []
  if (notice.arrival !== '') {
    parts.push(text('history.arrivalDetail', { time: formatTime(notice.arrival) }))
  }
  if (notice.reason !== '') parts.push(notice.reason)
  if (notice.attachmentName !== '') parts.push(notice.attachmentName)
  return parts.length === 0 ? '—' : parts.join(' · ')
}

function NoticeRow({ notice }: { notice: StudentNotice }): React.JSX.Element {
  const t = useText()
  return (
    <tr>
      <DateCell date={notice.date} />
      <td>
        <span className="badge badge-sm badge-soft badge-neutral">
          {t(noticeLabelKey[notice.kind])}
        </span>
      </td>
      <td className="truncate text-base-content/70" title={noticeDetail(notice)}>
        {noticeDetail(notice)}
      </td>
    </tr>
  )
}
