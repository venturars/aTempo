import type { RosterRow } from './roster'

type AttendanceMark = RosterRow['mark'] | 'cancelada' | 'sin-registro'

export function AttendanceStatus({ mark }: { mark: AttendanceMark }): React.JSX.Element {
  const attended = mark === 'presente'
  return (
    <span aria-hidden="true" className={`attendance-mark mark-${mark}`}>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {mark === 'retraso' ? (
          <>
            <circle cx="8" cy="8" r="5" />
            <path d="M8 5v3l2 1" />
          </>
        ) : attended ? (
          <path d="m4 8 2.5 2.5L12 5" />
        ) : mark === 'ausente' ? (
          <path d="m5 5 6 6m0-6-6 6" />
        ) : (
          <path d="M5 8h6" />
        )}
      </svg>
    </span>
  )
}
