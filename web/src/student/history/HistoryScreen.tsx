import { statusBadgeClass, statusLabel } from '../attendanceStatus'
import { StudentLayout } from '../StudentLayout'
import { useCurrentStudent } from '../studentAccounts'
import { weekdayName } from '../studentDate'
import { type ClassEntry } from '../studentExample'
import { readNoticesFor, type NoticeKind, type StudentNotice } from '../notice/studentNotices'

const noticeLabel: Record<NoticeKind, string> = {
  retraso: 'Retraso',
  ausencia: 'Ausencia'
}

// «Mié 11 nov» pasa a «11 nov». Las etiquetas no guardan el año.
function sessionDate(label: string): string {
  const [, day, month] = label.split(' ')
  return `${day} ${month}`
}

// Llegar tarde cuenta como asistencia.
function attendancePercent(history: ClassEntry[]): string {
  if (history.length === 0) return '—'
  const attended = history.filter((entry) => entry.status !== 'ausente').length
  return `${Math.round((attended / history.length) * 100)} %`
}

export function HistoryScreen(): React.JSX.Element {
  const student = useCurrentStudent()
  const history = student.history
  const notices = readNoticesFor(student.email)
  const late = history.filter((entry) => entry.status === 'tarde').length
  const absent = history.filter((entry) => entry.status === 'ausente').length

  return (
    <StudentLayout>
      <h1 className="text-2xl font-semibold tracking-tight">Tu asistencia</h1>
      <section className="panel-card rounded-box" aria-label="Totales">
        <dl className="grid grid-cols-3 divide-x">
          <Stat label="Asistencia" value={attendancePercent(history)} />
          <Stat label="Retrasos" value={String(late)} />
          <Stat label="Ausencias" value={String(absent)} />
        </dl>
      </section>
      <TableCard title="Tus clases">
        {history.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-base-content/60">
            Aún no tienes clases. ¡Nos vemos en la primera!
          </p>
        ) : (
          <table className="table panel-table table-fixed">
            <TableColumns />
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Llegada</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <HistoryRow key={entry.label} entry={entry} />
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
      {notices.length > 0 ? (
        <TableCard title="Tus avisos">
          <table className="table panel-table table-fixed">
            <TableColumns />
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Tipo</th>
                <th scope="col">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice, index) => (
                <NoticeRow key={`${notice.day}-${index}`} notice={notice} />
              ))}
            </tbody>
          </table>
        </TableCard>
      ) : null}
    </StudentLayout>
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

function DateCell({ label }: { label: string }): React.JSX.Element {
  return (
    <td>
      <span className="font-medium">{sessionDate(label)}</span>
      <span className="ml-2 hidden text-base-content/50 sm:inline">{weekdayName(label)}</span>
    </td>
  )
}

function HistoryRow({ entry }: { entry: ClassEntry }): React.JSX.Element {
  return (
    <tr>
      <DateCell label={entry.label} />
      <td className="tabular-nums text-base-content/70">
        {entry.arrival ?? <span className="text-base-content/35">—</span>}
      </td>
      <td>
        <span className={statusBadgeClass(entry.status)}>{statusLabel[entry.status]}</span>
      </td>
    </tr>
  )
}

function noticeDetail(notice: StudentNotice): string {
  const parts: string[] = []
  if (notice.arrival !== '') parts.push(`Llegada ${notice.arrival}`)
  if (notice.reason !== '') parts.push(notice.reason)
  if (notice.attachmentName !== '') parts.push(notice.attachmentName)
  return parts.length === 0 ? '—' : parts.join(' · ')
}

function NoticeRow({ notice }: { notice: StudentNotice }): React.JSX.Element {
  return (
    <tr>
      <DateCell label={notice.day} />
      <td>
        <span className="badge badge-sm badge-soft badge-neutral">{noticeLabel[notice.kind]}</span>
      </td>
      <td className="truncate text-base-content/70" title={noticeDetail(notice)}>
        {noticeDetail(notice)}
      </td>
    </tr>
  )
}
