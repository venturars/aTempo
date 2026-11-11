import { markClass, markLabel, trimesterDays, type AttendanceMark } from './trimesterExample'

const legendMarks: AttendanceMark[] = ['presente', 'retraso', 'ausencia']

export function ClaimPanel(): React.JSX.Element {
  return (
    <section
      className="flex flex-1 flex-col gap-8 rounded-box bg-base-300 p-8"
      aria-labelledby="claim"
    >
      <div className="flex flex-col gap-2">
        <p>aTempo</p>
        <h1 id="claim" className="text-2xl font-medium">
          Pasar lista ya no es parte de la clase.
        </h1>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium">Tu trimestre, sesión a sesión</h2>
        <ul className="flex flex-col gap-2">
          {trimesterDays.map((day) => (
            <li key={day.name} className="flex items-center gap-3" aria-label={day.name}>
              <span className="w-6 shrink-0">{day.label}</span>
              <span className="flex flex-wrap items-center gap-1">
                {day.marks.map((mark, index) => (
                  <span
                    key={`${day.name}-${index}`}
                    role="img"
                    className={`${markClass(mark)} shrink-0`}
                    aria-label={markLabel(mark)}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-4">
          {legendMarks.map((mark) => (
            <li key={mark} className="flex items-center gap-2">
              <span className={`${markClass(mark)} shrink-0`} aria-hidden="true" />
              {markLabel(mark)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
