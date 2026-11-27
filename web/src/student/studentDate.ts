import { formatDate } from '../lang/format'
import type { TextKey } from '../lang/messages'
import { text } from '../lang/useText'

// Antes de las 6 y desde las 21 es de noche. Hasta las 14 es por la mañana.
// Devuelve la clave del saludo: la pantalla lo traduce con t().
export function greetingKeyForHour(hour: number): TextKey {
  if (hour < 6 || hour >= 21) return 'dashboard.greeting.night'
  if (hour < 14) return 'dashboard.greeting.morning'
  return 'dashboard.greeting.afternoon'
}

// Las entradas y los avisos guardan el día como «2026-11-11», sin idioma.
export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// «2026-11-11» pasa a una fecha local. Con new Date('2026-11-11') sería medianoche en UTC
// y, al oeste de Greenwich, el día anterior.
export function dateFromKey(key: string): Date {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function capitalized(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// «11 nov», «Nov 11».
export function formatShortDate(date: Date): string {
  return formatDate(date, { day: 'numeric', month: 'short' })
}

// «Mié 11 nov», «Wed, Nov 11». Con capital en false, el español queda «mié 11 nov».
// Se llama al pintar, para que siga el idioma elegido.
export function formatDay(date: Date, capital = true): string {
  const weekday = formatDate(date, { weekday: 'short' })
  return text('app.dayLabel', {
    weekday: capital ? capitalized(weekday) : weekday,
    date: formatShortDate(date)
  })
}

// «Miércoles», «Wednesday».
export function weekdayName(date: Date): string {
  return capitalized(formatDate(date, { weekday: 'long' }))
}

// Minutos desde medianoche de una hora «HH:MM». Ejemplo: «09:30» → 570.
export function minutesOfDay(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Solo para leer lo que guardaron las versiones anteriores, que apuntaban el día en español
// («Mié 11 nov») y sin año. Devuelve «2026-11-11», o null si no se entiende.
const oldWeekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const oldMonths = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic'
]

// Busca hacia atrás desde hoy el año en que ese día cayó en ese día de la semana.
export function dateKeyFromOldLabel(label: string, today = new Date()): string | null {
  const [weekdayText = '', dayText = '', monthText = ''] = label.trim().split(' ')
  const weekday = oldWeekdays.indexOf(weekdayText)
  const month = oldMonths.indexOf(monthText)
  const day = Number(dayText)
  if (weekday === -1 || month === -1 || !Number.isInteger(day)) return null
  for (let year = today.getFullYear(); year > today.getFullYear() - 7; year -= 1) {
    const candidate = new Date(year, month, day)
    if (candidate.getMonth() === month && candidate.getDay() === weekday) return dateKey(candidate)
  }
  return null
}
