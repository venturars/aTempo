import { RecognitionIcon } from './RecognitionIcon'

export function RecognitionAward({
  title,
  kind,
  description,
  names,
  onSelect
}: {
  title: string
  kind: 'trophy' | 'clock'
  description: string
  names: string[]
  onSelect: (name: string) => void
}): React.JSX.Element {
  return (
    <article className="card bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-full ${
              kind === 'trophy' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
            }`}
          >
            <RecognitionIcon kind={kind} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-medium">{title}</h3>
            <p className="text-sm text-base-content/60">{description}</p>
          </div>
        </div>
        {names.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-1">
            {names.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="block w-full cursor-pointer truncate text-left text-sm font-medium"
                  onClick={() => onSelect(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-base-content/60">Nadie en estas fechas</p>
        )}
      </div>
    </article>
  )
}
