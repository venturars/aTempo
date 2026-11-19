const sampleTimeZone = '+01:00'

export function isoAt(day: string, time: string): string {
  return `${day}T${time}:00${sampleTimeZone}`
}

export function atSessionTime(sessionStartsAt: string, time: string): string {
  return `${sessionStartsAt.slice(0, 11)}${time}:00${sessionStartsAt.slice(19)}`
}

export function clockTime(iso: string): string {
  return iso.slice(11, 16)
}

export function dayOf(iso: string): string {
  return iso.slice(0, 10)
}

export function isClockTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function localDay(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
