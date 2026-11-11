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
    <article className="recognition-award">
      <div className="recognition-heading">
        <div className="recognition-prize">
          <RecognitionIcon kind={kind} />
        </div>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {names.length ? (
        <ul>
          {names.map((name) => (
            <li key={name}>
              <button type="button" onClick={() => onSelect(name)}>
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">Nadie en estas fechas</p>
      )}
    </article>
  )
}
