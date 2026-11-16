export function RecognitionIcon({ kind }: { kind: 'trophy' | 'clock' }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === 'trophy' ? (
        <>
          <path d="M12 5h16v11c0 7-3 11-8 11s-8-4-8-11V5Z" fill="currentColor" fillOpacity=".05" />
          <path d="M12 8H6v6c0 5 4 8 8 8m14-14h6v6c0 5-4 8-8 8M20 27v7m-6 1h12m-15 3h18M15 8v8q0 5 3 7" />
        </>
      ) : (
        <>
          <circle cx="20" cy="23" r="13" fill="currentColor" fillOpacity=".05" />
          <circle cx="20" cy="23" r="10.5" />
          <path d="M20 16v7l5 3m-7-16V7h4v3m-2-3V5m-5 0c0-5 10-5 10 0M20 13v2m0 16v2M10 23h2m16 0h2m-4-15c5-3 9-1 10 3" />
        </>
      )}
    </svg>
  )
}
