import { formatDate } from '../lang/format'

export function classDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function classDayLabel(date: string): string {
  const day = classDate(date)
  const weekday = capitalized(formatDate(day, { weekday: 'short' }))
  return `${weekday} ${formatDate(day, { day: 'numeric', month: 'short' })}`
}
