// Las fechas de los datos de ejemplo están en la hora de Madrid en noviembre: UTC+1.
const sampleTimeZone = '+01:00'

// Une un día (2026-11-11) y una hora (09:04) en una hora ISO 8601.
export function isoAt(day: string, time: string): string {
  return `${day}T${time}:00${sampleTimeZone}`
}

// La hora de una fecha ISO tal como está escrita: 2026-11-11T09:04:00+01:00 da 09:04.
export function clockTime(iso: string): string {
  return iso.slice(11, 16)
}

// El día de una fecha ISO tal como está escrito: 2026-11-11T09:04:00+01:00 da 2026-11-11.
export function dayOf(iso: string): string {
  return iso.slice(0, 10)
}
