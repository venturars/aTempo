import { formatDate } from '../language/format'

// Una clase se guarda con su fecha, «2026-11-10». Se lee como fecha local: con
// new Date('2026-11-10') sería medianoche en UTC y, al oeste de Greenwich, el día anterior.
export function classDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// El día de una clase: «Mar 10 nov». Se llama al pintar, para que siga el idioma elegido.
export function classDayLabel(date: string): string {
  const day = classDate(date)
  const weekday = capitalized(formatDate(day, { weekday: 'short' }))
  return `${weekday} ${formatDate(day, { day: 'numeric', month: 'short' })}`
}
