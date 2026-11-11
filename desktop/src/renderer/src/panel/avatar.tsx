import { compareByName, initialsOf, rosterNames } from './roster'

const avatarTones = [
  'avatar-tone-success',
  'avatar-tone-secondary',
  'avatar-tone-warning',
  'avatar-tone-info',
  'avatar-tone-error',
  'avatar-tone-primary'
]

const namesInOrder = [...rosterNames].sort(compareByName)

// Salta de tono para que dos filas seguidas no repitan color.
const toneOrder = [0, 3, 5, 1, 4, 2, 5, 0, 3, 1, 4, 2, 0, 5, 3]

function toneFor(name: string): string {
  const place = namesInOrder.indexOf(name)
  const slot =
    place === -1 ? name.length % avatarTones.length : toneOrder[place % toneOrder.length]
  return avatarTones[slot ?? 0] ?? avatarTones[0]
}

export function Avatar({
  name,
  compact = false,
  tall = false
}: {
  name: string
  compact?: boolean
  tall?: boolean
}): React.JSX.Element {
  const size = tall ? 'h-full aspect-square text-sm' : compact ? 'w-6' : 'w-8'
  return (
    <div className={`avatar avatar-placeholder shrink-0 ${tall ? 'self-stretch' : ''}`}>
      <div className={`${size} rounded-full font-medium ${tall ? '' : 'text-xs'} ${toneFor(name)}`}>
        <span>{initialsOf(name)}</span>
      </div>
    </div>
  )
}
