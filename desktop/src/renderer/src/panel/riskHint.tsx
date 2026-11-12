import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePanelStore } from './panelStore'
import { studentRisk } from './roster'

const riskClass = {
  warning: 'badge badge-sm badge-soft badge-warning shrink-0 cursor-pointer whitespace-nowrap',
  info: 'badge badge-sm badge-soft badge-info shrink-0 cursor-pointer whitespace-nowrap'
} as const

export function RiskHint({ name }: { name: string }): React.JSX.Element | null {
  const sessionMarks = usePanelStore((state) => state.sessionMarks)
  const risk = studentRisk(name, sessionMarks)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState<{
    top: number | null
    bottom: number | null
    left: number
  } | null>(null)
  if (risk === null) {
    return null
  }

  function place(): void {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect === undefined) {
      return
    }
    const width = 256
    const gap = 6
    const edge = 8
    const left = Math.max(edge, Math.min(rect.left, window.innerWidth - edge - width))
    const roomBelow = window.innerHeight - rect.bottom
    const roomAbove = rect.top
    const opensAbove = roomBelow < 96 && roomAbove > roomBelow
    setBox({
      left,
      top: opensAbove ? null : rect.bottom + gap,
      bottom: opensAbove ? window.innerHeight - rect.top + gap : null
    })
  }

  return (
    <span
      ref={anchorRef}
      onMouseEnter={place}
      onMouseLeave={() => setBox(null)}
      onClick={(event) => {
        event.stopPropagation()
        setBox(null)
      }}
    >
      <span className={riskClass[risk.tone]}>{risk.label}</span>
      {box !== null
        ? createPortal(
            <span
              className="tip popover-in fixed z-50 flex w-64 flex-col gap-1 px-3.5 py-3 text-sm leading-snug"
              style={{
                top: box.top ?? undefined,
                bottom: box.bottom ?? undefined,
                left: box.left
              }}
            >
              <span className="font-medium tracking-tight">{risk.header}</span>
              <span className="tip-body">{risk.explanation}</span>
            </span>,
            document.body
          )
        : null}
    </span>
  )
}
