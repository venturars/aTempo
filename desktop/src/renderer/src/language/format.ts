import { enGB, enUS, es, type Locale } from 'react-day-picker/locale'
import { useLanguageStore } from './languageStore'

function region(): string {
  return useLanguageStore.getState().region
}

// «10 nov 2026», «martes», «Nov 10, 2026»: options son las de Intl.DateTimeFormat.
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(region(), options)
}

// Una hora guardada como «HH:MM». Las regiones de 24 horas escriben «09:05»; las de
// 12 horas, «9:05 AM».
export function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const twelveHours = new Intl.DateTimeFormat(region(), { hour: 'numeric' }).resolvedOptions()
    .hour12
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(region(), {
    hour: twelveHours ? 'numeric' : '2-digit',
    minute: '2-digit'
  })
}

// Un periodo: «1–30 de noviembre de 2026», «November 1 – 30, 2026».
export function formatDateRange(from: Date, to: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(region(), options).formatRange(from, to)
}

// Fecha y hora de un instante, por ejemplo cuándo se corrigió una marca.
export function formatDateTime(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString(region(), options)
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(region(), options).format(value)
}

// Ordena textos con las reglas del idioma: en español, «Ángel» va con la A.
export function compareText(a: string, b: string): number {
  return a.localeCompare(b, region())
}

// El idioma del calendario. En inglés, Estados Unidos empieza la semana en domingo y
// el resto, en lunes.
export function calendarLocale(): Locale {
  const current = region()
  if (current.startsWith('es')) {
    return es
  }
  return current === 'en-US' ? enUS : enGB
}
