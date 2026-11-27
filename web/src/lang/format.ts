import { enGB, enUS, es, type Locale } from 'react-day-picker/locale'
import { useLanguageStore } from './languageStore'

function region(): string {
  return useLanguageStore.getState().region
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(region(), options)
}

export function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const twelveHours = new Intl.DateTimeFormat(region(), { hour: 'numeric' }).resolvedOptions()
    .hour12
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(region(), {
    hour: twelveHours ? 'numeric' : '2-digit',
    minute: '2-digit'
  })
}

export function formatDateRange(from: Date, to: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(region(), options).formatRange(from, to)
}

export function formatDateTime(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString(region(), options)
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(region(), options).format(value)
}

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, region())
}

export function calendarLocale(): Locale {
  const current = region()
  if (current.startsWith('es')) {
    return es
  }
  return current === 'en-US' ? enUS : enGB
}
