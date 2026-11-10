type TempitoIllustrationProps = {
  className?: string
  size?: 'md' | 'lg'
}

export function TempitoIllustration({
  className = '',
  size = 'lg'
}: TempitoIllustrationProps): React.JSX.Element {
  const dimensions = size === 'lg' ? { width: 120, height: 138 } : { width: 64, height: 73 }

  return (
    <svg
      className={className}
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <line x1="50" y1="40" x2="66" y2="6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="66" cy="8" r="7" fill="currentColor" />
      <path
        d="M14 72C14 50 30 34 50 34C70 34 86 50 86 72C86 94 72 106 50 106C28 106 14 94 14 72Z"
        className="fill-warning"
      />
      <ellipse cx="39" cy="68" rx="5" ry="7" className="fill-base-content" />
      <ellipse cx="61" cy="68" rx="5" ry="7" className="fill-base-content" />
      <circle cx="41" cy="65" r="1.8" className="fill-primary-content" />
      <circle cx="63" cy="65" r="1.8" className="fill-primary-content" />
      <path
        d="M42 84C46 89 54 89 58 84"
        className="stroke-base-content"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <ellipse cx="28" cy="80" rx="6" ry="4" fill="#FF9F6B" opacity="0.55" />
      <ellipse cx="72" cy="80" rx="6" ry="4" fill="#FF9F6B" opacity="0.55" />
      <rect x="30" y="104" width="12" height="8" rx="4" fill="#E6B321" />
      <rect x="58" y="104" width="12" height="8" rx="4" fill="#E6B321" />
    </svg>
  )
}
