type BeatKind = 'present' | 'late' | 'absent' | 'future' | 'now'

const desktopRows: Record<string, BeatKind[]> = {
  L: [
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'late'
  ],
  M: [
    'present',
    'present',
    'present',
    'absent',
    'present',
    'present',
    'absent',
    'present',
    'late',
    'present',
    'present',
    'present',
    'present',
    'late'
  ],
  X: [
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'now'
  ],
  J: [
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'late',
    'present',
    'present',
    'absent',
    'present',
    'present',
    'present',
    'future'
  ],
  V: [
    'present',
    'present',
    'present',
    'present',
    'present',
    'present',
    'late',
    'present',
    'present',
    'present',
    'present',
    'present',
    'late',
    'future'
  ]
}

function beatClass(kind: BeatKind): string {
  switch (kind) {
    case 'present':
      return 'bg-primary-content'
    case 'late':
      return 'bg-warning'
    case 'absent':
      return 'border-2 border-primary-content/45 bg-transparent'
    case 'future':
      return 'bg-primary-content/12'
    case 'now':
      return 'bg-primary-content shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_80%,black),0_0_0_7px_var(--color-warning)]'
  }
}

type LoginQuarterBeatsProps = {
  compact?: boolean
}

export function LoginQuarterBeats({ compact = false }: LoginQuarterBeatsProps): React.JSX.Element {
  const dotSize = compact ? 'size-5' : 'size-[26px]'

  return (
    <div
      className="rounded-box bg-[color-mix(in_oklab,var(--color-primary)_82%,black)] p-4 lg:p-7"
      aria-hidden
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <strong className="text-sm font-semibold lg:text-meta">Tu trimestre, sesión a sesión</strong>
        <em className="text-meta font-normal text-primary-content/70 not-italic lg:text-sm">Hoy, miércoles 09:00</em>
      </div>
      {Object.entries(desktopRows).map(([day, beats]) => (
        <div key={day} className={`flex items-center gap-2 ${compact ? 'mb-1.5' : 'mb-2.5'}`}>
          <span
            className={`shrink-0 font-semibold text-primary-content/60 ${compact ? 'w-3.5 text-xs' : 'w-[18px] text-meta'}`}
          >
            {day}
          </span>
          {beats.map((kind, index) => (
            <span key={`${day}-${index}`} className={`${dotSize} shrink-0 rounded-full ${beatClass(kind)}`} />
          ))}
        </div>
      ))}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta text-primary-content/80">
        <span className="flex items-center gap-2">
          <i className="size-3 rounded-full bg-primary-content" />
          Presente
        </span>
        <span className="flex items-center gap-2">
          <i className="size-3 rounded-full bg-warning" />
          Retraso
        </span>
        <span className="flex items-center gap-2">
          <i className="size-3 rounded-full border-2 border-primary-content/55 bg-transparent" />
          Ausencia
        </span>
      </div>
    </div>
  )
}
