import type { ReactNode } from 'react'

export function Frame(props: { children: ReactNode }) {
  return <div className="flex flex-col gap-8 bg-base-200 p-6">{props.children}</div>
}

export function Section(props: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-base-content/60">{props.title}</h2>
      <div className="flex flex-wrap items-center gap-3">{props.children}</div>
    </section>
  )
}
