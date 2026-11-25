import { useText } from '../language/useText'

// Vuelve a la pantalla anterior y dice a cuál: «‹ Sesiones».
// to es el nombre de esa pantalla, ya traducido por quien usa el botón.
export function BackButton({
  to,
  onClick
}: {
  to: string
  onClick: () => void
}): React.JSX.Element {
  const t = useText()
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm -ml-2 w-fit gap-1 px-2 font-normal text-base-content/70"
      aria-label={t('app.backTo', { screen: to })}
      onClick={onClick}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
        <path
          d="M10 3.5 5.5 8 10 12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {to}
    </button>
  )
}
