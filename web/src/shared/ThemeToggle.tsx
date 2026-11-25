import { useText } from '../language/useText'

const sunIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle className="theme-switch-sun-disc" cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

const moonIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path
      className="theme-switch-moon-shape"
      d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"
    />
    <path
      className="theme-switch-moon-shape"
      strokeWidth="1"
      d="M18 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"
    />
  </svg>
)

// Interruptor de tema: la bola se desliza al sol (claro) o a la luna (oscuro).
export function ThemeToggle({
  dark,
  onToggle
}: {
  dark: boolean
  onToggle: () => void
}): React.JSX.Element {
  const t = useText()
  return (
    <button
      className="theme-switch"
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t('app.darkTheme')}
      onClick={onToggle}
    >
      {sunIcon}
      {moonIcon}
      <span className="theme-switch-thumb" aria-hidden="true">
        <span key={dark ? 'moon' : 'sun'} className="contents">
          {dark ? moonIcon : sunIcon}
        </span>
      </span>
    </button>
  )
}
